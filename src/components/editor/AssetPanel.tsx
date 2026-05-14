import { useProjectStore } from '../../stores/projectStore'
import { useEditorStore } from '../../stores/editorStore'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Image, Upload, Trash2, SlidersHorizontal } from 'lucide-react'

export function AssetPanel() {
  const { currentProject, removeAsset, uploadAssets } = useProjectStore()
  const { selectedCategoryId, setSelectedAsset, selectedAssetId } = useEditorStore()

  const selectedCategory = currentProject?.categories.find(c => c.id === selectedCategoryId)

  return (
    <div className="h-full flex flex-col border-l">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div>
          <h3 className="text-sm font-medium">
            {selectedCategory ? selectedCategory.name : 'Assets'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {selectedCategory ? `${selectedCategory.assets.length} assets` : 'Select a category'}
          </p>
        </div>
        {selectedCategory && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </Button>
            <Button variant="default" size="sm" className="h-7 text-xs" onClick={() => uploadAssets(selectedCategory.id)}>
              <Upload className="h-3 w-3 mr-1" />
              Upload
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        {!selectedCategory ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Image className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">Select a category</p>
            <p className="text-xs mt-1">to view and manage assets</p>
          </div>
        ) : selectedCategory.assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Image className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No assets in this category</p>
            <p className="text-xs mt-2 mb-4">Upload PNG files with transparency</p>
            <Button variant="outline" size="sm" onClick={() => uploadAssets(selectedCategory.id)}>
              <Upload className="h-3.5 w-3.5 mr-2" />
              Upload Assets
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {selectedCategory.assets.map(asset => (
              <div
                key={asset.id}
                className={`group rounded-lg border p-2 cursor-pointer transition-all
                  ${selectedAssetId === asset.id ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
                onClick={() => setSelectedAsset(asset.id)}
              >
                <div className="aspect-square rounded-md bg-checkerboard mb-2 overflow-hidden relative">
                  {asset.thumbnailPath ? (
                    <img
                      src={`file://${asset.thumbnailPath}`}
                      alt={asset.name}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Image className="h-6 w-6" />
                    </div>
                  )}
                  <button
                    className="absolute top-1 right-1 p-1 rounded-md bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => { e.stopPropagation(); removeAsset(selectedCategory.id, asset.id) }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium truncate">{asset.name}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">{asset.rarityTier}</Badge>
                    <span className="text-[10px] text-muted-foreground">{asset.rarityWeight}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
