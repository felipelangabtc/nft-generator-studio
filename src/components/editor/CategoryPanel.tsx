import { useState } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { useEditorStore } from '../../stores/editorStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import {
  Plus, Trash2, Eye, EyeOff, GripVertical, Image,
  Upload, ChevronRight
} from 'lucide-react'

export function CategoryPanel() {
  const { currentProject, addCategory, updateCategory, removeCategory, uploadAssets } = useProjectStore()
  const { selectedCategoryId, setSelectedCategory } = useEditorStore()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return
    addCategory(newCategoryName.trim())
    setNewCategoryName('')
  }

  const toggleExpand = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!currentProject) return null

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Categories
        </h3>
        <Badge variant="outline" className="text-[10px]">
          {currentProject.categories.length}
        </Badge>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="New category..."
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          className="h-8 text-xs"
        />
        <Button size="icon" variant="outline" onClick={handleAddCategory} className="h-8 w-8">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-1">
        {currentProject.categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Image className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No categories yet</p>
            <p className="text-[10px] mt-1">Add your first layer category</p>
          </div>
        ) : (
          currentProject.categories.map(category => (
            <div key={category.id} className="rounded-md border">
              <div
                className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-accent/50 transition-colors
                  ${selectedCategoryId === category.id ? 'bg-accent' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 cursor-grab" />
                <ChevronRight
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform cursor-pointer
                    ${expandedCategories.has(category.id) ? 'rotate-90' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleExpand(category.id) }}
                />
                <span className="flex-1 text-sm truncate">{category.name}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {category.assets.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => { e.stopPropagation(); updateCategory(category.id, { enabled: !category.enabled }) }}
                >
                  {category.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={(e) => { e.stopPropagation(); removeCategory(category.id) }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {expandedCategories.has(category.id) && (
                <div className="px-2 pb-2 space-y-1">
                  {category.assets.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground pl-8">No assets</p>
                  ) : (
                    category.assets.map(asset => (
                      <div key={asset.id} className="flex items-center gap-2 pl-8 py-1 text-xs hover:bg-accent/30 rounded-sm">
                        <div className="w-5 h-5 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {asset.thumbnailPath ? (
                            <img src={`file://${asset.thumbnailPath}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Image className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <span className="flex-1 truncate">{asset.name}</span>
                        <Badge variant="outline" className="text-[10px]">{asset.rarityTier}</Badge>
                      </div>
                    ))
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs justify-start pl-8"
                    onClick={() => uploadAssets(category.id)}
                  >
                    <Upload className="h-3 w-3 mr-1.5" />
                    Upload Assets
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
