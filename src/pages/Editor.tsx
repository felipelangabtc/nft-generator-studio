import { useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '../stores/projectStore'
import { useEditorStore } from '../stores/editorStore'
import { useUIStore } from '../stores/uiStore'
import { CanvasPreview } from '../components/editor/CanvasPreview'
import { CategoryPanel } from '../components/editor/CategoryPanel'
import { AssetPanel } from '../components/editor/AssetPanel'
import { PropertiesPanel } from '../components/editor/PropertiesPanel'
import { RarityConfig } from '../components/editor/RarityConfig'
import { CompatibilityRules } from '../components/editor/CompatibilityRules'
import { GenerationDialog } from '../components/editor/GenerationDialog'
import { ExportDialog } from '../components/editor/ExportDialog'
import { ConsolePanel } from '../components/editor/ConsolePanel'
import { AIGenerationPanel } from '../components/editor/AIGenerationPanel'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Layers, Weight, AlertTriangle, Settings2 } from 'lucide-react'

export function Editor() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { currentProject, openProject, saveProject } = useProjectStore()
  const {
    activeTab, setActiveTab, showConsole, showSidebar,
    addConsoleEntry, showGenerationDialog, setShowGenerationDialog,
    showExportDialog, setShowExportDialog, showAIGeneration, setShowAIGeneration
  } = useEditorStore()
  const { addToast } = useUIStore()

  useEffect(() => {
    if (projectId) {
      openProject(projectId).catch(() => {
        addToast({ title: 'Project not found', type: 'error' })
        navigate('/')
      })
    }
  }, [projectId, openProject, navigate, addToast])

  useEffect(() => {
    if (currentProject) {
      addConsoleEntry({ level: 'info', message: `Opened project: ${currentProject.name}` })
    }
  }, [currentProject, addConsoleEntry])

  const handleSave = useCallback(async () => {
    await saveProject()
    addToast({ title: 'Project saved', type: 'success' })
    addConsoleEntry({ level: 'success', message: 'Project saved successfully' })
  }, [saveProject, addToast, addConsoleEntry])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const tabs = [
    { id: 'assets' as const, label: 'Assets', icon: Layers },
    { id: 'rarity' as const, label: 'Rarity', icon: Weight },
    { id: 'compatibility' as const, label: 'Rules', icon: AlertTriangle },
    { id: 'settings' as const, label: 'Settings', icon: Settings2 }
  ]

  return (
    <div className="h-full flex flex-col">
      <PanelGroup direction="horizontal" className="flex-1">
        {showSidebar && (
          <>
            <Panel defaultSize={20} minSize={15} maxSize={35}>
              <div className="h-full flex flex-col border-r">
                <div className="flex-1 overflow-hidden flex flex-col">
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <div className="px-2 pt-2">
                      <TabsList className="w-full">
                        {tabs.map(tab => (
                          <TabsTrigger key={tab.id} value={tab.id} className="flex-1">
                            <tab.icon className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden lg:inline">{tab.label}</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                      <TabsContent value="assets" className="m-0 p-0 h-full">
                        <CategoryPanel />
                      </TabsContent>
                      <TabsContent value="rarity" className="m-0 p-0">
                        <RarityConfig />
                      </TabsContent>
                      <TabsContent value="compatibility" className="m-0 p-0">
                        <CompatibilityRules />
                      </TabsContent>
                      <TabsContent value="settings" className="m-0 p-0">
                        <PropertiesPanel />
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </div>
            </Panel>
            <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
          </>
        )}

        <Panel defaultSize={showSidebar ? 55 : 80} minSize={30}>
          <CanvasPreview />
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

        <Panel defaultSize={25} minSize={15} maxSize={35}>
          <AssetPanel />
        </Panel>
      </PanelGroup>

      {showConsole && (
        <ConsolePanel />
      )}

      <GenerationDialog
        open={showGenerationDialog}
        onClose={() => setShowGenerationDialog(false)}
      />

      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />

      <AIGenerationPanel
        open={showAIGeneration}
        onClose={() => setShowAIGeneration(false)}
      />
    </div>
  )
}
