import { useRef, useEffect } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { Button } from '../ui/Button'
import { Trash2, Terminal } from 'lucide-react'
import { cn } from '../../lib/utils'

export function ConsolePanel() {
  const { consoleEntries, clearConsole } = useEditorStore()
  const consoleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [consoleEntries])

  const levelColors = {
    info: 'text-blue-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
    debug: 'text-muted-foreground',
    success: 'text-green-400'
  }

  const levelIcons = {
    info: 'ℹ',
    warn: '⚠',
    error: '✕',
    debug: '▸',
    success: '✓'
  }

  return (
    <div className="border-t bg-background" style={{ height: 150 }}>
      <div className="flex items-center justify-between px-3 py-1 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Console</span>
          <span className="text-[10px] text-muted-foreground">
            {consoleEntries.length} entries
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearConsole}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div
        ref={consoleRef}
        className="h-[calc(100%-28px)] overflow-y-auto scrollbar-thin p-2 font-mono text-xs space-y-0.5"
      >
        {consoleEntries.length === 0 ? (
          <p className="text-muted-foreground italic">No log entries yet</p>
        ) : (
          consoleEntries.map(entry => (
            <div key={entry.id} className="flex items-start gap-2">
              <span className={cn('flex-shrink-0', levelColors[entry.level])}>
                {levelIcons[entry.level]}
              </span>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              <span className={cn('break-all', levelColors[entry.level])}>
                {entry.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
