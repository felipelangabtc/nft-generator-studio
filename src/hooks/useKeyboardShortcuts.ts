import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../stores/projectStore'
import { useEditorStore } from '../stores/editorStore'
import { useUIStore } from '../stores/uiStore'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const { currentProject, saveProject } = useProjectStore()
  const { toggleSidebar, toggleConsole, undo, redo } = useEditorStore()
  const { addToast } = useUIStore()

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.key === 's') {
        e.preventDefault()
        if (currentProject) {
          await saveProject()
          addToast({ title: 'Project saved', type: 'success' })
        }
      }

      if (ctrl && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }

      if (ctrl && e.key === '`') {
        e.preventDefault()
        toggleConsole()
      }

      if (ctrl && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }

      if (e.key === 'Escape') {
        navigate('/')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentProject, saveProject, toggleSidebar, toggleConsole, undo, redo, navigate, addToast])
}
