import path from 'path'
import fs from 'fs'
import archiver from 'archiver'
import extractZip from 'extract-zip'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import type Pino from 'pino'

const ProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  canvasWidth: z.number().min(64).max(8192).default(1024),
  canvasHeight: z.number().min(64).max(8192).default(1024),
  tags: z.array(z.string()).default([])
})

export type ProjectCreateData = z.infer<typeof ProjectSchema>

export interface ProjectData {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  baseImage: string | null
  canvasWidth: number
  canvasHeight: number
  categories: CategoryData[]
  compatibilityRules: CompatibilityRuleData[]
  generationConfig: GenerationConfigData
  outputConfig: OutputConfigData
  version: number
  tags: string[]
  filePath: string
}

export interface CategoryData {
  id: string
  name: string
  zIndex: number
  enabled: boolean
  assets: AssetData[]
}

export interface AssetData {
  id: string
  name: string
  fileName: string
  filePath: string
  thumbnailPath: string
  rarityWeight: number
  rarityTier: string
  rarityScore: number
  enabled: boolean
  tags: string[]
  hash: string
  width: number
  height: number
  fileSize: number
}

export interface CompatibilityRuleData {
  id: string
  type: string
  sourceCategoryId: string
  sourceAssetId: string
  targetCategoryId: string
  targetAssetId: string
  enabled: boolean
  description: string
}

export interface GenerationConfigData {
  totalCount: number
  seed: string
  useSeed: boolean
  maxRetries: number
  parallelThreads: number
  enableDeduplication: boolean
  perceptualHashThreshold: number
  structuralHashThreshold: number
  generateMetadata: boolean
  generateReports: boolean
  outputFormat: string
  quality: number
}

export interface OutputConfigData {
  outputDir: string
  metadataFormat: string
  ipfsBaseUri: string
  imageBaseUri: string
  watermarkEnabled: boolean
  watermarkText: string
  watermarkOpacity: number
  createSubfolders: boolean
  batchSize: number
}

export class ProjectService {
  private projectsDir: string
  private currentProject: ProjectData | null = null
  private logger: Pino.Logger

  constructor(userDataPath: string, logger: Pino.Logger) {
    this.projectsDir = path.join(userDataPath, 'projects')
    this.logger = logger
    this.ensureDirectories()
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.projectsDir)) {
      fs.mkdirSync(this.projectsDir, { recursive: true })
    }
  }

  private getProjectDir(id: string): string {
    return path.join(this.projectsDir, id)
  }

  private getProjectFilePath(id: string): string {
    return path.join(this.getProjectDir(id), 'project.json')
  }

  getCurrentProject(): ProjectData | null {
    return this.currentProject
  }

  getCurrentProjectDir(): string | null {
    if (!this.currentProject) return null
    return this.getProjectDir(this.currentProject.id)
  }

  async create(data: ProjectCreateData): Promise<ProjectData> {
    const validated = ProjectSchema.parse(data)
    const id = uuidv4()
    const now = new Date().toISOString()
    const projectDir = this.getProjectDir(id)

    fs.mkdirSync(projectDir, { recursive: true })
    fs.mkdirSync(path.join(projectDir, 'base'), { recursive: true })
    fs.mkdirSync(path.join(projectDir, 'categories'), { recursive: true })
    fs.mkdirSync(path.join(projectDir, 'output', 'images'), { recursive: true })
    fs.mkdirSync(path.join(projectDir, 'output', 'metadata'), { recursive: true })
    fs.mkdirSync(path.join(projectDir, 'output', 'reports'), { recursive: true })
    fs.mkdirSync(path.join(projectDir, 'cache'), { recursive: true })
    fs.mkdirSync(path.join(projectDir, 'backups'), { recursive: true })

    const project: ProjectData = {
      id,
      name: validated.name,
      description: validated.description,
      createdAt: now,
      updatedAt: now,
      baseImage: null,
      canvasWidth: validated.canvasWidth,
      canvasHeight: validated.canvasHeight,
      categories: [],
      compatibilityRules: [],
      generationConfig: {
        totalCount: 100,
        seed: '',
        useSeed: false,
        maxRetries: 100,
        parallelThreads: 4,
        enableDeduplication: true,
        perceptualHashThreshold: 0.95,
        structuralHashThreshold: 0.9,
        generateMetadata: true,
        generateReports: true,
        outputFormat: 'png',
        quality: 100
      },
      outputConfig: {
        outputDir: path.join(projectDir, 'output'),
        metadataFormat: 'opensea',
        ipfsBaseUri: 'ipfs://',
        imageBaseUri: '',
        watermarkEnabled: false,
        watermarkText: '',
        watermarkOpacity: 0.3,
        createSubfolders: true,
        batchSize: 100
      },
      version: 1,
      tags: validated.tags,
      filePath: projectDir
    }

    this.saveProjectFile(project)
    this.currentProject = project
    this.logger.info({ projectId: id, name: project.name }, 'Project created')
    return project
  }

  async open(id: string): Promise<ProjectData | null> {
    const filePath = this.getProjectFilePath(id)
    if (!fs.existsSync(filePath)) {
      this.logger.error({ projectId: id }, 'Project file not found')
      return null
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const project = JSON.parse(raw) as ProjectData
      project.filePath = this.getProjectDir(id)
      this.currentProject = project
      this.logger.info({ projectId: id, name: project.name }, 'Project opened')
      return project
    } catch (err) {
      this.logger.error({ projectId: id, err }, 'Failed to open project')
      return null
    }
  }

  async save(project: ProjectData): Promise<ProjectData> {
    project.updatedAt = new Date().toISOString()
    project.version += 1
    this.currentProject = project
    this.saveProjectFile(project)
    this.createBackup(project)
    this.logger.info({ projectId: project.id, version: project.version }, 'Project saved')
    return project
  }

  async saveAs(project: ProjectData, filePath: string): Promise<ProjectData> {
    const projectData = {
      info: {
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: new Date().toISOString(),
        version: project.version,
        appVersion: '1.0.0'
      },
      config: {
        generationConfig: project.generationConfig,
        outputConfig: project.outputConfig
      },
      categories: project.categories,
      compatibilityRules: project.compatibilityRules,
      tags: project.tags
    }
    fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2), 'utf-8')
    return project
  }

  async list(): Promise<ProjectData[]> {
    const projects: ProjectData[] = []
    try {
      const entries = fs.readdirSync(this.projectsDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const projectFile = path.join(this.projectsDir, entry.name, 'project.json')
          if (fs.existsSync(projectFile)) {
            try {
              const raw = fs.readFileSync(projectFile, 'utf-8')
              const project = JSON.parse(raw) as ProjectData
              project.filePath = this.getProjectDir(entry.name)
              projects.push(project)
            } catch {
              continue
            }
          }
        }
      }
    } catch (err) {
      this.logger.error({ err }, 'Failed to list projects')
    }
    return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  async delete(id: string): Promise<boolean> {
    const projectDir = this.getProjectDir(id)
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true })
      if (this.currentProject?.id === id) {
        this.currentProject = null
      }
      this.logger.info({ projectId: id }, 'Project deleted')
      return true
    }
    return false
  }

  async duplicate(id: string): Promise<ProjectData | null> {
    const original = await this.open(id)
    if (!original) return null

    const now = new Date().toISOString()
    const newId = uuidv4()
    const newDir = this.getProjectDir(newId)

    const originalDir = this.getProjectDir(id)
    this.copyDirectory(originalDir, newDir)

    const newProject: ProjectData = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      filePath: newDir
    }

    this.saveProjectFile(newProject)
    this.currentProject = newProject
    return newProject
  }

  async export(id: string, destPath: string): Promise<string | null> {
    const project = await this.open(id)
    if (!project) return null

    const projectDir = this.getProjectDir(id)
    const output = fs.createWriteStream(destPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        this.logger.info({ path: destPath, size: archive.pointer() }, 'Project exported')
        resolve(destPath)
      })
      archive.on('error', reject)
      archive.pipe(output)
      archive.directory(projectDir, false)
      archive.finalize()
    })
  }

  async import(filePath: string): Promise<ProjectData | null> {
    try {
      const tempDir = path.join(this.projectsDir, `_import_${Date.now()}`)
      fs.mkdirSync(tempDir, { recursive: true })

      await extractZip(filePath, { dir: tempDir })

      const projectFile = path.join(tempDir, 'project.json')
      if (!fs.existsSync(projectFile)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
        throw new Error('Invalid project file')
      }

      const raw = fs.readFileSync(projectFile, 'utf-8')
      const project = JSON.parse(raw) as ProjectData
      const newId = uuidv4()
      const newDir = this.getProjectDir(newId)

      fs.renameSync(tempDir, newDir)
      project.id = newId
      project.filePath = newDir
      this.saveProjectFile(project)
      this.currentProject = project

      this.logger.info({ projectId: newId }, 'Project imported')
      return project
    } catch (err) {
      this.logger.error({ err, filePath }, 'Failed to import project')
      return null
    }
  }

  private saveProjectFile(project: ProjectData): void {
    const filePath = this.getProjectFilePath(project.id)
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf-8')
  }

  private createBackup(project: ProjectData): void {
    const backupDir = path.join(this.getProjectDir(project.id), 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    const backupPath = path.join(backupDir, `backup-${Date.now()}.json`)
    fs.writeFileSync(backupPath, JSON.stringify(project, null, 2), 'utf-8')
  }

  private copyDirectory(src: string, dest: string): void {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }
    const entries = fs.readdirSync(src, { withFileTypes: true })
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }
}
