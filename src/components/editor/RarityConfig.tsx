import { useProjectStore } from '../../stores/projectStore'
import { useEditorStore } from '../../stores/editorStore'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Slider } from '../ui/Slider'
import { RarityAPI } from '../../lib/api'
import { useUIStore } from '../../stores/uiStore'
import { Weight, RefreshCw, Percent } from 'lucide-react'
import type { RarityTier } from '../../types'
import { RARITY_TIER_COLORS } from '../../types'

export function RarityConfig() {
  const { currentProject, updateAsset } = useProjectStore()
  const { selectedCategoryId } = useEditorStore()
  const { addToast } = useUIStore()

  const selectedCategory = currentProject?.categories.find(c => c.id === selectedCategoryId)

  const handleWeightChange = (assetId: string, weight: number) => {
    if (!selectedCategoryId) return
    updateAsset(selectedCategoryId, assetId, { rarityWeight: Math.round(weight * 10) / 10 })
  }

  const handleNormalize = async () => {
    try {
      await RarityAPI.normalize()
      addToast({ title: 'Weights normalized', type: 'success' })
    } catch {
      addToast({ title: 'Failed to normalize', type: 'error' })
    }
  }

  const getTotalWeight = () => {
    if (!selectedCategory) return 0
    return selectedCategory.assets
      .filter(a => a.enabled)
      .reduce((sum, a) => sum + a.rarityWeight, 0)
  }

  if (!selectedCategory) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
        <Weight className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">Select a category</p>
        <p className="text-xs mt-1">to configure rarity weights</p>
      </div>
    )
  }

  const totalWeight = getTotalWeight()
  const enabledAssets = selectedCategory.assets.filter(a => a.enabled)

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Weight className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Rarity: {selectedCategory.name}</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleNormalize}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Normalize
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>{enabledAssets.length} assets</span>
        <span>Total: {totalWeight.toFixed(1)}%</span>
      </div>

      <div className="space-y-3">
        {enabledAssets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Percent className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No enabled assets</p>
            <p className="text-[10px] mt-1">Enable assets to configure rarity</p>
          </div>
        ) : (
          enabledAssets.map(asset => (
            <div key={asset.id} className="space-y-1.5 p-2 rounded-md border bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant="outline"
                    className="w-2 h-2 p-0 rounded-full"
                    style={{ backgroundColor: RARITY_TIER_COLORS[asset.rarityTier as RarityTier] || '#9ca3af' }}
                  />
                  <span className="text-xs font-medium truncate">{asset.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {asset.rarityTier}
                  </Badge>
                  <span className="text-xs font-mono w-10 text-right">
                    {totalWeight > 0 ? ((asset.rarityWeight / totalWeight) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              </div>
              <Slider
                value={asset.rarityWeight}
                onChange={(v) => handleWeightChange(asset.id, v)}
                min={0.1}
                max={100}
                step={0.1}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
