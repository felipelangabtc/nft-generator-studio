import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { v4 as uuidv4 } from 'uuid'
import { ProjectAPI, ImageAPI } from '../lib/api'
import type {
  Project, Category, Asset, CompatibilityRule,
  GenerationConfig, OutputConfig, GenerationProgress,
  CollectionStats
} from '../types'
import { DEFAULT_GENERATION_CONFIG, DEFAULT_OUTPUT_CONFIG } from '../types'

interface ProjectState {
  currentProject: Project | null
  projects: Project[]
  generationProgress: GenerationProgress | null
  collectionStats: CollectionStats | null
  isLoading: boolean
  error: string | null
  recentProjects: string[]

  setCurrentProject: (project: Project | null) => void
  loadProjects: () => Promise<void>
  createProject: (data: { name: string; description?: string; canvasWidth?: number; canvasHeight?: number }) => Promise<Project>
  openProject: (id: string) => Promise<void>
  saveProject: () => Promise<void>
  deleteProject: (id: string) => Promise<void>
  duplicateProject: (id: string) => Promise<void>
  importProject: () => Promise<void>
  exportProject: () => Promise<void>

  updateProject: (updates: Partial<Project>) => void

  setBaseImage: (imagePath: string) => Promise<void>

  addCategory: (name: string) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  removeCategory: (id: string) => void
  reorderCategories: (categoryIds: string[]) => void

  addAssets: (categoryId: string, assets: Asset[]) => void
  updateAsset: (categoryId: string, assetId: string, updates: Partial<Asset>) => void
  removeAsset: (categoryId: string, assetId: string) => void
  uploadAssets: (categoryId: string) => Promise<void>

  addCompatibilityRule: (rule: Omit<CompatibilityRule, 'id'>) => void
  updateCompatibilityRule: (id: string, updates: Partial<CompatibilityRule>) => void
  removeCompatibilityRule: (id: string) => void

  updateGenerationConfig: (updates: Partial<GenerationConfig>) => void
  updateOutputConfig: (updates: Partial<OutputConfig>) => void

  setGenerationProgress: (progress: GenerationProgress | null) => void
  setCollectionStats: (stats: CollectionStats | null) => void

  clearError: () => void
  selectBaseImage: () => Promise<void>
}

export const useProjectStore = create<ProjectState>()(
  persist(
    immer((set, get) => ({
      currentProject: null,
      projects: [],
      generationProgress: null,
      collectionStats: null,
      isLoading: false,
      error: null,
      recentProjects: [],

      setCurrentProject: (project) => set(state => {
        state.currentProject = project
      }),

      loadProjects: async () => {
        set(state => { state.isLoading = true })
        try {
          const projects = await ProjectAPI.list()
          set(state => {
            state.projects = projects as Project[]
            state.isLoading = false
          })
        } catch (err) {
          set(state => {
            state.error = (err as Error).message
            state.isLoading = false
          })
        }
      },

      createProject: async (data) => {
        set(state => { state.isLoading = true })
        try {
          const project = await ProjectAPI.create({
            name: data.name,
            description: data.description || '',
            canvasWidth: data.canvasWidth || 1024,
            canvasHeight: data.canvasHeight || 1024,
            tags: []
          }) as Project
          set(state => {
            state.currentProject = project
            state.isLoading = false
          })
          return project
        } catch (err) {
          set(state => {
            state.error = (err as Error).message
            state.isLoading = false
          })
          throw err
        }
      },

      openProject: async (id) => {
        set(state => { state.isLoading = true })
        try {
          const project = await ProjectAPI.open(id) as Project | null
          if (!project) throw new Error('Project not found')
          set(state => {
            state.currentProject = project
            state.isLoading = false
          })
        } catch (err) {
          set(state => {
            state.error = (err as Error).message
            state.isLoading = false
          })
        }
      },

      saveProject: async () => {
        const { currentProject } = get()
        if (!currentProject) return
        try {
          const saved = await ProjectAPI.save(currentProject) as Project
          set(state => { state.currentProject = saved })
        } catch (err) {
          set(state => { state.error = (err as Error).message })
        }
      },

      deleteProject: async (id) => {
        try {
          await ProjectAPI.delete(id)
          set(state => {
            state.projects = state.projects.filter(p => p.id !== id)
            if (state.currentProject?.id === id) {
              state.currentProject = null
            }
          })
        } catch (err) {
          set(state => { state.error = (err as Error).message })
        }
      },

      duplicateProject: async (id) => {
        try {
          await ProjectAPI.duplicate(id)
          await get().loadProjects()
        } catch (err) {
          set(state => { state.error = (err as Error).message })
        }
      },

      importProject: async () => {
        try {
          await ProjectAPI.import()
          await get().loadProjects()
        } catch (err) {
          set(state => { state.error = (err as Error).message })
        }
      },

      exportProject: async () => {
        const { currentProject } = get()
        if (!currentProject) return
        try {
          await ProjectAPI.export(currentProject.id)
        } catch (err) {
          set(state => { state.error = (err as Error).message })
        }
      },

      updateProject: (updates) => set(state => {
        if (state.currentProject) {
          Object.assign(state.currentProject, updates)
        }
      }),

      setBaseImage: async (_imagePath) => {
        try {
          const result = await ImageAPI.selectBase()
          if (result) {
            set(state => {
              if (state.currentProject) {
                state.currentProject.baseImage = result.filePath
                state.currentProject.canvasWidth = result.width
                state.currentProject.canvasHeight = result.height
              }
            })
          }
        } catch (err) {
          set(state => { state.error = (err as Error).message })
        }
      },

      addCategory: (name) => set(state => {
        if (!state.currentProject) return
        const maxZ = state.currentProject.categories.reduce((max, c) => Math.max(max, c.zIndex), -1)
        state.currentProject.categories.push({
          id: uuidv4(),
          name,
          zIndex: maxZ + 1,
          enabled: true,
          assets: []
        })
      }),

      updateCategory: (id, updates) => set(state => {
        if (!state.currentProject) return
        const idx = state.currentProject.categories.findIndex(c => c.id === id)
        if (idx !== -1) {
          Object.assign(state.currentProject.categories[idx], updates)
        }
      }),

      removeCategory: (id) => set(state => {
        if (!state.currentProject) return
        state.currentProject.categories = state.currentProject.categories.filter(c => c.id !== id)
        state.currentProject.compatibilityRules = state.currentProject.compatibilityRules.filter(
          r => r.sourceCategoryId !== id && r.targetCategoryId !== id
        )
      }),

      reorderCategories: (categoryIds) => set(state => {
        if (!state.currentProject) return
        const reordered = categoryIds.map((id, idx) => {
          const cat = state.currentProject!.categories.find(c => c.id === id)
          if (cat) return { ...cat, zIndex: idx }
          return null
        }).filter(Boolean) as Category[]
        state.currentProject.categories = reordered
      }),

      addAssets: (categoryId, assets) => set(state => {
        if (!state.currentProject) return
        const category = state.currentProject.categories.find(c => c.id === categoryId)
        if (category) {
          category.assets.push(...assets)
        }
      }),

      updateAsset: (categoryId, assetId, updates) => set(state => {
        if (!state.currentProject) return
        const category = state.currentProject.categories.find(c => c.id === categoryId)
        if (category) {
          const asset = category.assets.find(a => a.id === assetId)
          if (asset) {
            Object.assign(asset, updates)
          }
        }
      }),

      removeAsset: (categoryId, assetId) => set(state => {
        if (!state.currentProject) return
        const category = state.currentProject.categories.find(c => c.id === categoryId)
        if (category) {
          category.assets = category.assets.filter(a => a.id !== assetId)
        }
      }),

      uploadAssets: async (categoryId) => {
        try {
          const result = await ImageAPI.uploadAssets(categoryId)
          if (result && Array.isArray(result) && result.length > 0) {
            const assets: Asset[] = result.map((a: any) => ({
              id: a.id,
              name: a.name,
              fileName: a.fileName,
              filePath: a.filePath,
              thumbnailPath: a.thumbnailPath,
              rarityWeight: 10.0,
              rarityTier: 'common' as const,
              rarityScore: 0,
              enabled: true,
              tags: [],
              hash: a.hash,
              width: a.width,
              height: a.height,
              fileSize: a.fileSize
            }))
            get().addAssets(categoryId, assets)
          }
        } catch (err) {
          set(state => { state.error = (err as Error).message })
        }
      },

      addCompatibilityRule: (rule) => set(state => {
        if (!state.currentProject) return
        state.currentProject.compatibilityRules.push({
          ...rule,
          id: uuidv4()
        } as CompatibilityRule)
      }),

      updateCompatibilityRule: (id, updates) => set(state => {
        if (!state.currentProject) return
        const rule = state.currentProject.compatibilityRules.find(r => r.id === id)
        if (rule) Object.assign(rule, updates)
      }),

      removeCompatibilityRule: (id) => set(state => {
        if (!state.currentProject) return
        state.currentProject.compatibilityRules = state.currentProject.compatibilityRules.filter(r => r.id !== id)
      }),

      updateGenerationConfig: (updates) => set(state => {
        if (state.currentProject) {
          if (!state.currentProject.generationConfig) {
            state.currentProject.generationConfig = { ...DEFAULT_GENERATION_CONFIG }
          }
          Object.assign(state.currentProject.generationConfig, updates)
        }
      }),

      updateOutputConfig: (updates) => set(state => {
        if (state.currentProject) {
          if (!state.currentProject.outputConfig) {
            state.currentProject.outputConfig = { ...DEFAULT_OUTPUT_CONFIG }
          }
          Object.assign(state.currentProject.outputConfig, updates)
        }
      }),

      setGenerationProgress: (progress) => set(state => {
        state.generationProgress = progress
      }),

      setCollectionStats: (stats) => set(state => {
        state.collectionStats = stats
      }),

      clearError: () => set(state => { state.error = null }),

      selectBaseImage: async () => {
        try {
          const result = await ImageAPI.selectBase()
          if (result) {
            set(state => {
              if (state.currentProject) {
                state.currentProject.baseImage = result.filePath
                state.currentProject.canvasWidth = result.width
                state.currentProject.canvasHeight = result.height
              }
            })
          }
        } catch (err) {
          set(state => { state.error = (err as Error).message })
        }
      }
    })),
    {
      name: 'nft-generator-project',
      partialize: (state) => ({
        recentProjects: state.recentProjects
      })
    }
  )
)
