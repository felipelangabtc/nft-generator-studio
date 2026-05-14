import { useState, useEffect, useRef } from 'react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { Progress } from '../ui/Progress'
import { useProjectStore } from '../../stores/projectStore'
import { useUIStore } from '../../stores/uiStore'
import { GenerationAPI } from '../../lib/api'
import { Play, Square, Pause, Sparkles, AlertCircle, Clock, Layers } from 'lucide-react'

interface GenerationDialogProps {
  open: boolean
  onClose: () => void
}

export function GenerationDialog({ open, onClose }: GenerationDialogProps) {
  const { currentProject, generationProgress, setGenerationProgress } = useProjectStore()
  const { addToast } = useUIStore()
  const [count, setCount] = useState(currentProject?.generationConfig.totalCount ?? 100)
  const [prefix, setPrefix] = useState('NFT')
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (open && generationProgress?.status === 'generating') {
      intervalRef.current = setInterval(async () => {
        try {
          const status = await GenerationAPI.status()
          setGenerationProgress(status)
        } catch {
          // status check failed silently
        }
      }, 500)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [open, generationProgress?.status, setGenerationProgress])

  const handleStart = async () => {
    if (!currentProject) return
    try {
      await GenerationAPI.start({
        totalCount: count,
        namePrefix: prefix,
        description: currentProject.description,
        outputFormat: currentProject.generationConfig.outputFormat,
        quality: currentProject.generationConfig.quality,
        enableDeduplication: currentProject.generationConfig.enableDeduplication,
        perceptualHashThreshold: currentProject.generationConfig.perceptualHashThreshold,
        seed: currentProject.generationConfig.seed,
        useSeed: currentProject.generationConfig.useSeed,
        maxRetries: currentProject.generationConfig.maxRetries,
        parallelThreads: currentProject.generationConfig.parallelThreads,
        generateMetadata: currentProject.generationConfig.generateMetadata,
        generateReports: currentProject.generationConfig.generateReports
      })
      addToast({ title: 'Generation started', type: 'success' })
    } catch (err) {
      addToast({ title: 'Generation failed', description: (err as Error).message, type: 'error' })
    }
  }

  const handlePause = async () => {
    await GenerationAPI.pause()
    addToast({ title: 'Generation paused', type: 'info' })
  }

  const handleResume = async () => {
    await GenerationAPI.resume()
    addToast({ title: 'Generation resumed', type: 'success' })
  }

  const handleStop = async () => {
    await GenerationAPI.stop()
    setGenerationProgress(null)
    addToast({ title: 'Generation stopped', type: 'info' })
  }

  const isGenerating = generationProgress?.status === 'generating'
  const isPaused = generationProgress?.status === 'paused'

  const enabledCategories = currentProject?.categories.filter(c => c.enabled && c.assets.some(a => a.enabled)) || []
  const totalPossible = enabledCategories.length > 0
    ? enabledCategories.reduce((acc, c) => {
        const count = c.assets.filter(a => a.enabled).length
        return count > 0 ? acc * count : acc
      }, 1)
    : 0

  return (
    <Dialog open={open} onClose={onClose} title="Generate Collection" size="lg">
      <div className="space-y-6">
        {isGenerating || isPaused || generationProgress?.status === 'completed' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-medium">
                  {generationProgress?.status === 'completed' ? 'Generation Complete' : 'Generating...'}
                </h3>
              </div>
              <Badge variant={
                generationProgress?.status === 'completed' ? 'success' :
                isPaused ? 'warning' : 'info'
              }>
                {generationProgress?.status}
              </Badge>
            </div>

            <Progress value={generationProgress?.percentage || 0} />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{generationProgress?.current || 0}</p>
                <p className="text-xs text-muted-foreground">Generated</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{generationProgress?.duplicatesFound || 0}</p>
                <p className="text-xs text-muted-foreground">Duplicates</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {generationProgress?.estimatedRemaining
                    ? `${Math.ceil(generationProgress.estimatedRemaining / 1000)}s`
                    : '--'}
                </p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
            </div>

            <div className="flex justify-center gap-2">
              {isGenerating && (
                <Button variant="outline" onClick={handlePause}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              {isPaused && (
                <Button variant="default" onClick={handleResume}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button variant="destructive" onClick={handleStop}>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <Layers className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{enabledCategories.length}</p>
                <p className="text-xs text-muted-foreground">Active Layers</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <Sparkles className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">
                  {totalPossible > 1000000
                    ? `${(totalPossible / 1000000).toFixed(1)}M`
                    : totalPossible > 1000
                    ? `${(totalPossible / 1000).toFixed(1)}K`
                    : totalPossible}
                </p>
                <p className="text-xs text-muted-foreground">Possible Combos</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">To Generate</p>
              </div>
            </div>

            <Input
              label="Number of NFTs to Generate"
              type="number"
              value={count}
              onChange={(e) => setCount(Math.min(parseInt(e.target.value) || 0, totalPossible))}
              min={1}
              max={totalPossible}
            />

            <Input
              label="Name Prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="NFT"
            />

            {totalPossible < count && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Requested count exceeds possible combinations ({totalPossible.toLocaleString()}).
                  Some duplicates may occur.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleStart} disabled={count < 1 || enabledCategories.length === 0}>
                <Play className="h-4 w-4 mr-2" />
                Start Generation
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
