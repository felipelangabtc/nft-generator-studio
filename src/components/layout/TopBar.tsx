import { useNavigate, useLocation } from 'react-router-dom'
import { useProjectStore } from '../../stores/projectStore'
import { useEditorStore } from '../../stores/editorStore'
import { Button } from '../ui/Button'
import {
  Sparkles, Settings, Home, Save, Play, Download,
  Undo2, Redo2, PanelLeft, Monitor
} from 'lucide-react'

interface TopBarProps {
  showEditorNav: boolean
}

export function TopBar({ showEditorNav }: TopBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentProject, saveProject } = useProjectStore()
  const { toggleSidebar, toggleConsole, setShowGenerationDialog, setShowExportDialog, undo, redo } = useEditorStore()

  return (
    <header className="glass h-12 flex items-center px-4 gap-2 select-none">
      <div className="flex items-center gap-2 mr-4">
        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm hidden md:block">NFT Studio</span>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} data-active={location.pathname === '/'}>
          <Home className="h-4 w-4" />
        </Button>
        {currentProject && (
          <Button variant="ghost" size="sm" className="text-sm">
            {currentProject.name}
          </Button>
        )}
      </div>

      {showEditorNav && (
        <>
          <div className="w-px h-6 bg-border mx-2" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <PanelLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleConsole}>
              <Monitor className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="icon" onClick={() => undo()}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => redo()}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={saveProject}>
              <Save className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Save</span>
            </Button>
            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setShowGenerationDialog(true)}>
              <Play className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Generate</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
              <Download className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </>
      )}

      <div className="flex-1" />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
