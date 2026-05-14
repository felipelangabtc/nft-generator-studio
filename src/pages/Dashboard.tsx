import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProjectStore } from '../stores/projectStore'
import { useUIStore } from '../stores/uiStore'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import {
  Plus, FolderOpen, Upload, Trash2, Copy,
  Image, Clock, Sparkles, ArrowRight, Package, Layers
} from 'lucide-react'
import type { Project } from '../types'

export function Dashboard() {
  const navigate = useNavigate()
  const { projects, loadProjects, createProject, deleteProject, duplicateProject, importProject, isLoading } = useProjectStore()
  const { addToast } = useUIStore()
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleCreate = async () => {
    if (!newProjectName.trim()) return
    try {
      const project = await createProject({ name: newProjectName.trim(), description: newProjectDesc.trim() })
      setShowNewDialog(false)
      setNewProjectName('')
      setNewProjectDesc('')
      addToast({ title: 'Project created', type: 'success' })
      navigate(`/editor/${project.id}`)
    } catch (err) {
      addToast({ title: 'Failed to create project', description: (err as Error).message, type: 'error' })
    }
  }

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return
    await deleteProject(deleteConfirm.id)
    setDeleteConfirm(null)
    addToast({ title: 'Project deleted', type: 'info' })
  }, [deleteConfirm, deleteProject, addToast])

  const handleDuplicate = async (id: string) => {
    await duplicateProject(id)
    addToast({ title: 'Project duplicated', type: 'success' })
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your NFT collections</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={importProject}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setShowNewDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Package} label="Total Projects" value={projects.length} />
          <StatCard icon={Layers} label="Active Projects" value={projects.filter(p => p.categories.length > 0).length} />
          <StatCard icon={Sparkles} label="Recent" value={projects.slice(0, 5).length} subtitle="last 5" />
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4">Recent Projects</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : projects.length === 0 ? (
            <EmptyState onNewProject={() => setShowNewDialog(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProjectCard
                    project={project}
                    onOpen={() => navigate(`/editor/${project.id}`)}
                    onDelete={() => setDeleteConfirm({ id: project.id, name: project.name })}
                    onDuplicate={() => handleDuplicate(project.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        title="Create New Project"
        description="Set up a new NFT collection project"
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            placeholder="My NFT Collection"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            autoFocus
          />
          <Input
            label="Description (optional)"
            placeholder="Describe your collection..."
            value={newProjectDesc}
            onChange={(e) => setNewProjectDesc(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newProjectName.trim()}>Create Project</Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Project"
        description={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, subtitle }: { icon: any; label: string; value: number; subtitle?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{value}</span>
            {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ project, onOpen, onDelete, onDuplicate }: {
  project: Project
  onOpen: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  return (
    <div className="group rounded-lg border bg-card hover:shadow-lg hover:shadow-black/10 transition-all duration-200">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium truncate">{project.name}</h3>
              {project.description && (
                <p className="text-xs text-muted-foreground truncate">{project.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDate(project.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            <span>{project.categories.length} cats</span>
          </div>
          <Badge variant="outline">v{project.version}</Badge>
        </div>

        <div className="flex items-center gap-1 pt-1">
          <Button variant="default" size="sm" className="flex-1" onClick={onOpen}>
            <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
            Open
          </Button>
          <Button variant="ghost" size="icon" onClick={onDuplicate}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onNewProject }: { onNewProject: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-full bg-primary/5 mb-4">
        <Image className="h-12 w-12 text-primary/40" />
      </div>
      <h3 className="text-lg font-medium mb-2">No projects yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Create your first NFT collection project to start generating unique PFP images
      </p>
      <div className="flex items-center gap-2">
        <Button onClick={onNewProject}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
        <Button variant="outline" onClick={() => {}}>
          <FolderOpen className="h-4 w-4 mr-2" />
          Open Existing
        </Button>
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString()
}
