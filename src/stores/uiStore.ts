import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { ThemeMode, Language } from '../types'

interface UIState {
  theme: ThemeMode
  language: Language
  sidebarWidth: number
  consoleHeight: number
  autoSave: boolean
  autoSaveInterval: number
  telemetryEnabled: boolean
  autoUpdate: boolean
  isUpdateAvailable: boolean
  updateProgress: number | null
  toasts: Toast[]

  setTheme: (theme: ThemeMode) => void
  setLanguage: (language: Language) => void
  setSidebarWidth: (width: number) => void
  setConsoleHeight: (height: number) => void
  setAutoSave: (enabled: boolean) => void
  setTelemetry: (enabled: boolean) => void
  setAutoUpdate: (enabled: boolean) => void
  setIsUpdateAvailable: (available: boolean) => void
  setUpdateProgress: (progress: number | null) => void

  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export interface Toast {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export const useUIStore = create<UIState>()(
  persist(
    immer((set, _get) => ({
      theme: (localStorage.getItem('theme') as ThemeMode) || 'dark',
      language: 'en',
      sidebarWidth: 280,
      consoleHeight: 200,
      autoSave: true,
      autoSaveInterval: 60000,
      telemetryEnabled: false,
      autoUpdate: true,
      isUpdateAvailable: false,
      updateProgress: null,
      toasts: [],

      setTheme: (theme) => {
        set(state => { state.theme = theme })
        localStorage.setItem('theme', theme)
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark')
        } else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          document.documentElement.classList.toggle('dark', prefersDark)
        }
      },

      setLanguage: (language) => set(state => { state.language = language }),
      setSidebarWidth: (width) => set(state => { state.sidebarWidth = Math.max(200, Math.min(500, width)) }),
      setConsoleHeight: (height) => set(state => { state.consoleHeight = Math.max(100, Math.min(500, height)) }),
      setAutoSave: (enabled) => set(state => { state.autoSave = enabled }),
      setTelemetry: (enabled) => set(state => { state.telemetryEnabled = enabled }),
      setAutoUpdate: (enabled) => set(state => { state.autoUpdate = enabled }),
      setIsUpdateAvailable: (available) => set(state => { state.isUpdateAvailable = available }),
      setUpdateProgress: (progress) => set(state => { state.updateProgress = progress }),

      addToast: (toast) => set(state => {
        const id = crypto.randomUUID?.() ?? `${Date.now()}`
        const entry: Toast = { ...toast, id, duration: toast.duration || 5000 }
        state.toasts.push(entry)
        if (state.toasts.length > 5) {
          state.toasts = state.toasts.slice(-5)
        }
      }),

      removeToast: (id) => set(state => {
        state.toasts = state.toasts.filter(t => t.id !== id)
      }),

      clearToasts: () => set(state => { state.toasts = [] })
    })),
    {
      name: 'nft-generator-ui',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarWidth: state.sidebarWidth,
        consoleHeight: state.consoleHeight,
        autoSave: state.autoSave,
        telemetryEnabled: state.telemetryEnabled,
        autoUpdate: state.autoUpdate
      })
    }
  )
)
