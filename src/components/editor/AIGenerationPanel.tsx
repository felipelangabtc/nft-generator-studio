import { useState } from 'react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { Progress } from '../ui/Progress'
import { useProjectStore } from '../../stores/projectStore'
import { useEditorStore } from '../../stores/editorStore'
import { useUIStore } from '../../stores/uiStore'
import { AIAPI } from '../../lib/api'
import { Brain, Image, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import type { AIGeneratedAsset } from '../../types'

interface AIGenerationPanelProps {
  open: boolean
  onClose: () => void
}

export function AIGenerationPanel({ open, onClose }: AIGenerationPanelProps) {
  return open ? <AIGenerationPanelInner onClose={onClose} /> : null
}

function AIGenerationPanelInner({ onClose }: { onClose: () => void }) {
  const { currentProject, addAssets, selectBaseImage } = useProjectStore()
  const { addConsoleEntry } = useEditorStore()
  const { addToast } = useUIStore()

  const [baseImage, setBaseImage] = useState<string | null>(currentProject?.baseImage || null)
  const [prompts, setPrompts] = useState<Record<string, string>>(() => {
    if (!currentProject) return {}
    const p: Record<string, string> = {}
    currentProject.categories.forEach(cat => {
      p[cat.id] = `Create a ${cat.name.toLowerCase()} layer for this character`
    })
    return p
  })
  const [countPerCategory, setCountPerCategory] = useState(3)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [generatedCount, setGeneratedCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)

  const handleSelectBaseImage = async () => {
    await selectBaseImage()
    if (currentProject?.baseImage) {
      setBaseImage(currentProject.baseImage)
    }
  }

  const handleGenerate = async () => {
    if (!currentProject || !baseImage) return

    const enabledCategories = currentProject.categories.filter(c => c.enabled)
    if (enabledCategories.length === 0) {
      addToast({ title: 'No categories', description: 'Add at least one category first', type: 'error' })
      return
    }

    setIsGenerating(true)
    setGeneratedCount(0)
    setErrorCount(0)
    const totalRequests = enabledCategories.length * countPerCategory
    setProgress({ current: 0, total: totalRequests })

    let localGenerated = 0
    let localErrors = 0

    for (const category of enabledCategories) {
      const prompt = prompts[category.id] || `Create a ${category.name.toLowerCase()} layer for this character`

      try {
        const result = await AIAPI.generateLayers({
          baseImagePath: baseImage,
          categoryId: category.id,
          categoryName: category.name,
          prompt,
          count: countPerCategory
        })

        if (result && Array.isArray(result)) {
          const assets = result.map((a: AIGeneratedAsset) => ({
            id: a.id,
            name: a.name,
            fileName: `${a.id}.png`,
            filePath: a.filePath,
            thumbnailPath: a.thumbnailPath,
            rarityWeight: 10.0,
            rarityTier: 'common' as const,
            rarityScore: 0,
            enabled: true,
            tags: [],
            hash: '',
            width: a.width,
            height: a.height,
            fileSize: 0
          }))

          addAssets(category.id, assets)
          localGenerated += assets.length
          setGeneratedCount(localGenerated)
          addConsoleEntry({
            level: 'info',
            message: `AI generated ${assets.length} assets for "${category.name}"`
          })
        }
      } catch (err) {
        const msg = (err as Error).message
        localErrors++
        setErrorCount(localErrors)
        addConsoleEntry({ level: 'error', message: `AI generation failed for "${category.name}": ${msg}` })
        addToast({ title: `AI error for "${category.name}"`, description: msg, type: 'error' })
      }

      setProgress(prev => ({ ...prev, current: prev.current + countPerCategory }))
    }

    setIsGenerating(false)
    if (localGenerated > 0) {
      addToast({ title: 'AI generation complete', description: `${localGenerated} assets generated`, type: 'success' })
    }
  }

  const handleCancel = async () => {
    try {
      await AIAPI.cancel()
    } catch {
      // ignore cancel errors
    }
    setIsGenerating(false)
  }

  const enabledCategories = currentProject?.categories.filter(c => c.enabled) || []
  const totalToGenerate = enabledCategories.length * countPerCategory

  return (
    <Dialog open={true} onClose={onClose} title="AI Layer Generation" size="xl" description="Generate layer variations from a base image using AI">
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Base Image</p>
              <p className="text-xs text-muted-foreground">Reference image for AI generation</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSelectBaseImage}>
              <Image className="h-3.5 w-3.5 mr-1.5" />
              {baseImage ? 'Change' : 'Select Image'}
            </Button>
          </div>
          {baseImage && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
              <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                <img src={`file://${baseImage}`} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs truncate flex-1">{baseImage.split(/[\\/]/).pop()}</span>
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Input
            label="Variations per category"
            type="number"
            value={countPerCategory}
            onChange={(e) => setCountPerCategory(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={20}
            className="w-40"
          />
          <div className="pt-5">
            <Badge variant="secondary" className="text-xs">
              {totalToGenerate} total images
            </Badge>
          </div>
        </div>

        {enabledCategories.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Prompts per category
            </p>
            {enabledCategories.map(category => (
              <div key={category.id} className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs flex-shrink-0 w-24 truncate">
                  {category.name}
                </Badge>
                <input
                  className="flex-1 rounded-md border border-input bg-transparent px-3 py-1.5 text-xs"
                  value={prompts[category.id] || ''}
                  onChange={(e) => setPrompts(prev => ({ ...prev, [category.id]: e.target.value }))}
                  placeholder={`Create a ${category.name.toLowerCase()} layer...`}
                />
              </div>
            ))}
          </div>
        )}

        {isGenerating && (
          <div className="space-y-3 p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">Generating layers...</span>
              </div>
              <Badge variant="info">{progress.current}/{progress.total}</Badge>
            </div>
            <Progress value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} />
            {generatedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {generatedCount} assets generated{errorCount > 0 ? `, ${errorCount} errors` : ''}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Close
          </Button>
          {isGenerating ? (
            <Button variant="destructive" onClick={handleCancel}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={!baseImage || enabledCategories.length === 0}>
              <Brain className="h-4 w-4 mr-2" />
              Generate with AI
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  )
}
