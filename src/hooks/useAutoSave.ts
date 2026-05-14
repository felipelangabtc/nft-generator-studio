import { useEffect, useRef } from 'react'
import { useProjectStore } from '../stores/projectStore'
import { useUIStore } from '../stores/uiStore'

export function useAutoSave() {
  const { currentProject, saveProject } = useProjectStore()
  const { autoSave, autoSaveInterval } = useUIStore()
  const lastSaveRef = useRef<string>('')

  useEffect(() => {
    if (!autoSave || !currentProject) return

    const interval = setInterval(async () => {
      const projectJson = JSON.stringify({
        name: currentProject.name,
        categories: currentProject.categories,
        version: currentProject.version
      })

      if (projectJson !== lastSaveRef.current) {
        await saveProject()
        lastSaveRef.current = projectJson
      }
    }, autoSaveInterval)

    return () => clearInterval(interval)
  }, [autoSave, autoSaveInterval, currentProject, saveProject])
}
