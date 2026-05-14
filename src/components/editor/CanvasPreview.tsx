import { useRef, useState, useCallback } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { useEditorStore } from '../../stores/editorStore'
import { Button } from '../ui/Button'
import { GenerationAPI } from '../../lib/api'
import { cn } from '../../lib/utils'
import { ZoomIn, ZoomOut, Maximize2, Shuffle, Grid3X3, RotateCcw } from 'lucide-react'

export function CanvasPreview() {
  const { currentProject } = useProjectStore()
  const {
    previewZoom, setPreviewZoom, previewPan, setPreviewPan,
    showCheckerboard, toggleCheckerboard
  } = useEditorStore()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const generatePreview = useCallback(async () => {
    try {
      const result = await GenerationAPI.preview()
      if (result) {
        setPreviewImage(`file://${result}`)
      }
    } catch {
      // Preview is optional
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - previewPan.x, y: e.clientY - previewPan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPreviewPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setPreviewZoom(previewZoom + delta)
  }

  const handleReset = () => {
    setPreviewZoom(1)
    setPreviewPan({ x: 0, y: 0 })
  }

  const hasLayers = currentProject?.categories?.some(c => c.enabled && c.assets.length > 0)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setPreviewZoom(previewZoom - 0.1)}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(previewZoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={() => setPreviewZoom(previewZoom + 0.1)}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCheckerboard}
            data-active={showCheckerboard}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={generatePreview}>
            <Shuffle className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Random Preview</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div
        ref={canvasRef}
        className={cn(
          'flex-1 flex items-center justify-center overflow-hidden relative',
          showCheckerboard ? 'checkerboard' : 'bg-black/5',
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {!hasLayers ? (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Add categories and assets</p>
            <p className="text-xs mt-1">to see a preview here</p>
          </div>
        ) : previewImage ? (
          <div
            className="relative"
            style={{
              transform: `translate(${previewPan.x}px, ${previewPan.y}px) scale(${previewZoom})`,
              width: currentProject?.canvasWidth || 1024,
              height: currentProject?.canvasHeight || 1024
            }}
          >
            <img
              src={previewImage}
              alt="NFT Preview"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Click "Random Preview" to generate</p>
          </div>
        )}

        <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
          {currentProject?.canvasWidth} × {currentProject?.canvasHeight}
        </div>
      </div>
    </div>
  )
}
