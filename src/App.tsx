import { useEffect, lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AppLayout } from './components/layout/AppLayout'
import { ToastContainer } from './components/ui/Toast'
import { useUIStore } from './stores/uiStore'
import { useProjectStore } from './stores/projectStore'
import { useEditorStore } from './stores/editorStore'
import { useAutoSave } from './hooks/useAutoSave'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Editor = lazy(() => import('./pages/Editor').then(m => ({ default: m.Editor })))
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

function AppInit() {
  const { saveProject } = useProjectStore()
  const { toggleSidebar, toggleConsole, setShowGenerationDialog, setShowExportDialog } = useEditorStore()

  useAutoSave()
  useKeyboardShortcuts()

  useEffect(() => {
    const api = window.electronAPI
    if (!api) return

    const unsubs: (() => void)[] = []

    unsubs.push(api.on('menu:save-project', () => { saveProject() }))
    unsubs.push(api.on('menu:toggle-sidebar', () => { toggleSidebar() }))
    unsubs.push(api.on('menu:toggle-console', () => { toggleConsole() }))
    unsubs.push(api.on('menu:start-generation', () => { setShowGenerationDialog(true) }))
    unsubs.push(api.on('menu:export-collection', () => { setShowExportDialog(true) }))

    return () => { unsubs.forEach(fn => fn()) }
  }, [saveProject, toggleSidebar, toggleConsole, setShowGenerationDialog, setShowExportDialog])

  return null
}

export default function App() {
  const { theme, toasts, removeToast } = useUIStore()
  const { loadProjects } = useProjectStore()

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', mediaQuery.matches)
      }
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    }
  }, [theme])

  return (
    <HashRouter>
      <AppInit />
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="editor/:projectId" element={<Editor />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </AnimatePresence>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </HashRouter>
  )
}
