import { useProjectStore } from '../../stores/projectStore'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Slider } from '../ui/Slider'
import { Settings2, Ruler, Download } from 'lucide-react'

export function PropertiesPanel() {
  const { currentProject, updateProject, updateGenerationConfig, updateOutputConfig } = useProjectStore()

  if (!currentProject) return null

  const genConfig = currentProject.generationConfig
  const outConfig = currentProject.outputConfig

  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Project Settings</h3>
      </div>

      <div className="space-y-3">
        <Input
          label="Project Name"
          value={currentProject.name}
          onChange={(e) => updateProject({ name: e.target.value })}
        />

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1"
            rows={3}
            value={currentProject.description}
            onChange={(e) => updateProject({ description: e.target.value })}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Ruler className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Canvas</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Width"
            type="number"
            value={currentProject.canvasWidth}
            onChange={(e) => updateProject({ canvasWidth: parseInt(e.target.value) || 1024 })}
          />
          <Input
            label="Height"
            type="number"
            value={currentProject.canvasHeight}
            onChange={(e) => updateProject({ canvasHeight: parseInt(e.target.value) || 1024 })}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Download className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Generation</h3>
        </div>
        <div className="space-y-3">
          <Input
            label="Total NFTs"
            type="number"
            value={genConfig?.totalCount ?? 100}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 100
              updateGenerationConfig({ totalCount: val })
            }}
          />
          <Select
            label="Output Format"
            value={genConfig?.outputFormat || 'png'}
            onChange={(e) => {
              updateGenerationConfig({ outputFormat: e.target.value as any })
            }}
            options={[
              { value: 'png', label: 'PNG' },
              { value: 'webp', label: 'WebP' },
              { value: 'avif', label: 'AVIF' }
            ]}
          />
          <Slider
            label="Quality"
            value={genConfig?.quality ?? 100}
            onChange={(v) => updateGenerationConfig({ quality: v })}
            min={1}
            max={100}
          />
          <Input
            label="Parallel Threads"
            type="number"
            value={genConfig?.parallelThreads ?? 4}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 4
              updateGenerationConfig({ parallelThreads: val })
            }}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold mb-3">Metadata</h3>
        <div className="space-y-3">
          <Select
            label="Format"
            value={outConfig?.metadataFormat || 'opensea'}
            onChange={(e) => {
              updateOutputConfig({ metadataFormat: e.target.value as any })
            }}
            options={[
              { value: 'opensea', label: 'OpenSea' },
              { value: 'magiceden', label: 'Magic Eden' },
              { value: 'erc721', label: 'ERC-721' },
              { value: 'erc1155', label: 'ERC-1155' }
            ]}
          />
          <Input
            label="IPFS Base URI"
            value={outConfig?.ipfsBaseUri || ''}
            onChange={(e) => updateOutputConfig({ ipfsBaseUri: e.target.value })}
            placeholder="ipfs://"
          />
        </div>
      </div>

      <div className="pt-2">
        <Button className="w-full" variant="outline" size="sm">
          Restore Defaults
        </Button>
      </div>
    </div>
  )
}
