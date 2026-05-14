import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface EditorState {
  selectedCategoryId: string | null
  selectedAssetId: string | null
  previewZoom: number
  previewPan: { x: number; y: number }
  showCheckerboard: boolean
  showConsole: boolean
  showSidebar: boolean
  activeTab: 'assets' | 'rarity' | 'compatibility' | 'settings'
  consoleEntries: ConsoleEntry[]
  undoStack: any[]
  redoStack: any[]
  isFullscreen: boolean
  showGenerationDialog: boolean
  showExportDialog: boolean
  showAIGeneration: boolean

  setSelectedCategory: (id: string | null) => void
  setSelectedAsset: (id: string | null) => void
  setPreviewZoom: (zoom: number) => void
  setPreviewPan: (pan: { x: number; y: number }) => void
  toggleCheckerboard: () => void
  toggleConsole: () => void
  toggleSidebar: () => void
  setActiveTab: (tab: 'assets' | 'rarity' | 'compatibility' | 'settings') => void
  addConsoleEntry: (entry: Omit<ConsoleEntry, 'id' | 'timestamp'>) => void
  clearConsole: () => void
  pushUndo: (state: any) => void
  pushRedo: (state: any) => void
  undo: () => any | null
  redo: () => any | null
  toggleFullscreen: () => void
  setShowGenerationDialog: (show: boolean) => void
  setShowExportDialog: (show: boolean) => void
  setShowAIGeneration: (show: boolean) => void
}

export interface ConsoleEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug' | 'success'
  message: string
  details?: string
}

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
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
    isFullscreen: false,
    showGenerationDialog: false,
    showExportDialog: false,
    showAIGeneration: false,

    setSelectedCategory: (id) => set(state => {
      state.selectedCategoryId = id
      state.selectedAssetId = null
    }),

    setSelectedAsset: (id) => set(state => {
      state.selectedAssetId = id
    }),

    setPreviewZoom: (zoom) => set(state => {
      state.previewZoom = Math.max(0.1, Math.min(5, zoom))
    }),

    setPreviewPan: (pan) => set(state => {
      state.previewPan = pan
    }),

    toggleCheckerboard: () => set(state => {
      state.showCheckerboard = !state.showCheckerboard
    }),

    toggleConsole: () => set(state => {
      state.showConsole = !state.showConsole
    }),

    toggleSidebar: () => set(state => {
      state.showSidebar = !state.showSidebar
    }),

    setActiveTab: (tab) => set(state => {
      state.activeTab = tab
    }),

    addConsoleEntry: (entry) => set(state => {
      state.consoleEntries.push({
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: new Date().toISOString()
      })
      if (state.consoleEntries.length > 1000) {
        state.consoleEntries = state.consoleEntries.slice(-1000)
      }
    }),

    clearConsole: () => set(state => {
      state.consoleEntries = []
    }),

    pushUndo: (data) => set(state => {
      state.undoStack.push(data)
      if (state.undoStack.length > 50) {
        state.undoStack.shift()
      }
      state.redoStack = []
    }),

    pushRedo: (data) => set(state => {
      state.redoStack.push(data)
    }),

    undo: () => {
      const state = get()
      if (state.undoStack.length === 0) return null
      const prev = state.undoStack[state.undoStack.length - 1]
      set(s => {
        s.undoStack.pop()
      })
      return prev
    },

    redo: () => {
      const state = get()
      if (state.redoStack.length === 0) return null
      const next = state.redoStack[state.redoStack.length - 1]
      set(s => {
        s.redoStack.pop()
      })
      return next
    },

    toggleFullscreen: () => set(state => {
      state.isFullscreen = !state.isFullscreen
    }),

    setShowGenerationDialog: (show) => set(state => {
      state.showGenerationDialog = show
    }),

    setShowExportDialog: (show) => set(state => {
      state.showExportDialog = show
    }),

    setShowAIGeneration: (show) => set(state => {
      state.showAIGeneration = show
    })
  }))
)
