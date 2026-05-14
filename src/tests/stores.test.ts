import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '../stores/projectStore'
import { useEditorStore } from '../stores/editorStore'
import { useUIStore } from '../stores/uiStore'

describe('ProjectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      currentProject: null,
      projects: [],
      generationProgress: null,
      collectionStats: null,
      isLoading: false,
      error: null,
      recentProjects: []
    })
  })

  it('initializes with default state', () => {
    const state = useProjectStore.getState()
    expect(state.currentProject).toBeNull()
    expect(state.projects).toEqual([])
    expect(state.isLoading).toBe(false)
  })

  it('adds a category to current project', () => {
    const store = useProjectStore.getState()
    store.setCurrentProject({
      id: 'test-id',
      name: 'Test Project',
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      baseImage: null,
      canvasWidth: 1024,
      canvasHeight: 1024,
      categories: [],
      compatibilityRules: [],
      generationConfig: {} as any,
      outputConfig: {} as any,
      version: 1,
      tags: []
    })

    useProjectStore.getState().addCategory('Background')
    const project = useProjectStore.getState().currentProject
    expect(project?.categories).toHaveLength(1)
    expect(project?.categories[0].name).toBe('Background')
  })

  it('removes a category', () => {
    const store = useProjectStore.getState()
    store.setCurrentProject({
      id: 'test-id',
      name: 'Test',
      description: '',
      createdAt: '',
      updatedAt: '',
      baseImage: null,
      canvasWidth: 1024,
      canvasHeight: 1024,
      categories: [{ id: 'cat-1', name: 'Test', zIndex: 0, enabled: true, assets: [] }],
      compatibilityRules: [],
      generationConfig: {} as any,
      outputConfig: {} as any,
      version: 1,
      tags: []
    })

    useProjectStore.getState().removeCategory('cat-1')
    expect(useProjectStore.getState().currentProject?.categories).toHaveLength(0)
  })
})

describe('EditorStore', () => {
  beforeEach(() => {
    useEditorStore.setState({
      selectedCategoryId: null,
      selectedAssetId: null,
      previewZoom: 1,
      previewPan: { x: 0, y: 0 },
      showCheckerboard: true,
      showConsole: true,
      showSidebar: true,
      activeTab: 'assets',
      consoleEntries: [],
      undoStack: [],
      redoStack: [],
      isFullscreen: false
    })
  })

  it('initializes with default state', () => {
    const state = useEditorStore.getState()
    expect(state.previewZoom).toBe(1)
    expect(state.showSidebar).toBe(true)
  })

  it('sets selected category', () => {
    useEditorStore.getState().setSelectedCategory('cat-1')
    expect(useEditorStore.getState().selectedCategoryId).toBe('cat-1')
  })

  it('zooms in', () => {
    useEditorStore.getState().setPreviewZoom(2)
    expect(useEditorStore.getState().previewZoom).toBe(2)
  })

  it('clamps zoom to range', () => {
    useEditorStore.getState().setPreviewZoom(10)
    expect(useEditorStore.getState().previewZoom).toBe(5)
  })

  it('adds console entries', () => {
    useEditorStore.getState().addConsoleEntry({ level: 'info', message: 'test' })
    expect(useEditorStore.getState().consoleEntries).toHaveLength(1)
    expect(useEditorStore.getState().consoleEntries[0].message).toBe('test')
  })

  it('clears console', () => {
    useEditorStore.getState().addConsoleEntry({ level: 'info', message: 'test' })
    useEditorStore.getState().clearConsole()
    expect(useEditorStore.getState().consoleEntries).toHaveLength(0)
  })
})

describe('UIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      theme: 'dark',
      language: 'en',
      sidebarWidth: 280,
      consoleHeight: 200,
      autoSave: true,
      autoSaveInterval: 60000,
      telemetryEnabled: false,
      autoUpdate: true,
      isUpdateAvailable: false,
      updateProgress: null,
      toasts: []
    })
  })

  it('initializes with dark theme', () => {
    const state = useUIStore.getState()
    expect(state.theme).toBe('dark')
  })

  it('sets theme', () => {
    useUIStore.getState().setTheme('light')
    expect(useUIStore.getState().theme).toBe('light')
  })

  it('adds toasts', () => {
    useUIStore.getState().addToast({ title: 'Hello', type: 'success' })
    expect(useUIStore.getState().toasts).toHaveLength(1)
    expect(useUIStore.getState().toasts[0].title).toBe('Hello')
  })

  it('removes toasts', () => {
    useUIStore.getState().addToast({ title: 'Test', type: 'info' })
    const id = useUIStore.getState().toasts[0].id
    useUIStore.getState().removeToast(id)
    expect(useUIStore.getState().toasts).toHaveLength(0)
  })
})
