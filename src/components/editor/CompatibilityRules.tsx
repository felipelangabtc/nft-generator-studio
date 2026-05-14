import { useState } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import { AlertTriangle, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { CompatibilityType } from '../../types'

export function CompatibilityRules() {
  const {
    currentProject, addCompatibilityRule, updateCompatibilityRule,
    removeCompatibilityRule
  } = useProjectStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRule, setNewRule] = useState({
    type: 'exclusion' as CompatibilityType,
    sourceCategoryId: '',
    sourceAssetId: '',
    targetCategoryId: '',
    targetAssetId: '',
    enabled: true,
    description: ''
  })

  if (!currentProject) return null

  const allCategories = currentProject.categories
  const allAssets = (categoryId: string) =>
    allCategories.find(c => c.id === categoryId)?.assets || []

  const getAssetName = (categoryId: string, assetId: string) => {
    const cat = allCategories.find(c => c.id === categoryId)
    return cat?.assets.find(a => a.id === assetId)?.name || 'Unknown'
  }

  const getCategoryName = (id: string) =>
    allCategories.find(c => c.id === id)?.name || 'Unknown'

  const handleAdd = () => {
    if (!newRule.sourceCategoryId || !newRule.targetCategoryId) return
    const desc = `"${getAssetName(newRule.sourceCategoryId, newRule.sourceAssetId) || 'Any'}" in "${getCategoryName(newRule.sourceCategoryId)}"
      ${newRule.type === 'exclusion' ? 'prevents' : 'requires'}
      "${getAssetName(newRule.targetCategoryId, newRule.targetAssetId) || 'Any'}" in "${getCategoryName(newRule.targetCategoryId)}"`
    addCompatibilityRule({
      ...newRule,
      enabled: true,
      description: desc
    })
    setShowAddForm(false)
    setNewRule({ type: 'exclusion' as CompatibilityType, sourceCategoryId: '', sourceAssetId: '', targetCategoryId: '', targetAssetId: '', enabled: true, description: '' })
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Compatibility Rules</h3>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {currentProject.compatibilityRules.length}
        </Badge>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs"
        onClick={() => setShowAddForm(true)}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Rule
      </Button>

      {showAddForm && (
        <div className="p-3 rounded-md border space-y-3">
          <Select
            label="Type"
            value={newRule.type}
            onChange={(e) => setNewRule(prev => ({ ...prev, type: e.target.value as CompatibilityType }))}
            options={[
              { value: 'exclusion', label: 'Exclusion (A prevents B)' },
              { value: 'requirement', label: 'Requirement (A requires B)' },
              { value: 'mutual_exclusion', label: 'Mutual Exclusion' }
            ]}
          />

          <Select
            label="Source Category"
            value={newRule.sourceCategoryId}
            onChange={(e) => setNewRule(prev => ({ ...prev, sourceCategoryId: e.target.value, sourceAssetId: '' }))}
            options={[
              { value: '', label: 'Select category...' },
              ...allCategories.map(c => ({ value: c.id, label: c.name }))
            ]}
          />

          {newRule.sourceCategoryId && (
            <Select
              label="Source Asset (optional)"
              value={newRule.sourceAssetId}
              onChange={(e) => setNewRule(prev => ({ ...prev, sourceAssetId: e.target.value }))}
              options={[
                { value: '', label: 'Any asset' },
                ...allAssets(newRule.sourceCategoryId).map(a => ({ value: a.id, label: a.name }))
              ]}
            />
          )}

          <Select
            label="Target Category"
            value={newRule.targetCategoryId}
            onChange={(e) => setNewRule(prev => ({ ...prev, targetCategoryId: e.target.value, targetAssetId: '' }))}
            options={[
              { value: '', label: 'Select category...' },
              ...allCategories.map(c => ({ value: c.id, label: c.name }))
            ]}
          />

          {newRule.targetCategoryId && (
            <Select
              label="Target Asset (optional)"
              value={newRule.targetAssetId}
              onChange={(e) => setNewRule(prev => ({ ...prev, targetAssetId: e.target.value }))}
              options={[
                { value: '', label: 'Any asset' },
                ...allAssets(newRule.targetCategoryId).map(a => ({ value: a.id, label: a.name }))
              ]}
            />
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={!newRule.sourceCategoryId || !newRule.targetCategoryId}>
              Add Rule
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {currentProject.compatibilityRules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No compatibility rules</p>
            <p className="text-[10px] mt-1">Add rules to prevent incompatible trait combinations</p>
          </div>
        ) : (
          currentProject.compatibilityRules.map(rule => (
            <div key={rule.id} className="flex items-start gap-2 p-2 rounded-md border group">
              <Badge variant={
                rule.type === 'exclusion' ? 'destructive' :
                rule.type === 'requirement' ? 'info' : 'warning'
              } className="text-[10px] mt-0.5">
                {rule.type === 'exclusion' ? 'X' : rule.type === 'requirement' ? 'R' : 'M'}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-xs">{rule.description || 'Rule'}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => updateCompatibilityRule(rule.id, { enabled: !rule.enabled })}
                >
                  {rule.enabled ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => removeCompatibilityRule(rule.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
