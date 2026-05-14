import { useEffect, useState } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { useEditorStore } from '../../stores/editorStore'
import { Badge } from '../ui/Badge'
import { Terminal, HardDrive, Cpu } from 'lucide-react'

interface SystemStats {
  memory: number
  cpu: number
}

export function StatusBar() {
  const { currentProject, generationProgress } = useProjectStore()
  const { showConsole, toggleConsole } = useEditorStore()
  const [stats, setStats] = useState<SystemStats>({ memory: 0, cpu: 0 })
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
      const nav = navigator as unknown as { deviceMemory?: number }
      if (nav.deviceMemory) {
        setStats(prev => ({ ...prev, memory: nav.deviceMemory || 0 }))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const genStatus = generationProgress?.status
  const genBadge = genStatus && genStatus !== 'idle' ? (
    <Badge variant={
      genStatus === 'generating' ? 'info' :
      genStatus === 'paused' ? 'warning' :
      genStatus === 'completed' ? 'success' :
      genStatus === 'error' ? 'destructive' : 'default'
    }>
      {genStatus}
    </Badge>
  ) : null

  return (
    <footer className="glass h-6 flex items-center px-3 text-xs text-muted-foreground border-t select-none">
      <div className="flex items-center gap-3">
        {currentProject && (
          <span>{currentProject.name} v{currentProject.version}</span>
        )}
        {genBadge}
        {generationProgress && generationProgress.status === 'generating' && (
          <span>
            {generationProgress.current}/{generationProgress.total}
            ({generationProgress.percentage.toFixed(0)}%)
          </span>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <button
          onClick={toggleConsole}
          className={`flex items-center gap-1 hover:text-foreground transition-colors ${showConsole ? 'text-foreground' : ''}`}
        >
          <Terminal className="h-3 w-3" />
          <span>Console</span>
        </button>

        <div className="flex items-center gap-1">
          <Cpu className="h-3 w-3" />
          <span>{stats.cpu}%</span>
        </div>

        <div className="flex items-center gap-1">
          <HardDrive className="h-3 w-3" />
          <span>{stats.memory.toFixed(1)}GB</span>
        </div>

        <span>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </footer>
  )
}
