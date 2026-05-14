import { useState } from 'react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { useProjectStore } from '../../stores/projectStore'
import { useUIStore } from '../../stores/uiStore'
import { ReportAPI } from '../../lib/api'
import { Download, FileSpreadsheet, FileJson, FileImage } from 'lucide-react'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
}

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const { currentProject } = useProjectStore()
  const { addToast } = useUIStore()
  const [reportFormat, setReportFormat] = useState('csv')
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeImages, setIncludeImages] = useState(true)
  const [includeReports, setIncludeReports] = useState(true)

  const handleExport = async () => {
    try {
      addToast({ title: 'Export started', type: 'info' })
      if (includeReports) {
        await ReportAPI.generate(reportFormat)
      }
      addToast({ title: 'Export completed', type: 'success' })
      onClose()
    } catch (err) {
      addToast({ title: 'Export failed', description: (err as Error).message, type: 'error' })
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Export Collection" size="md">
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-muted/30">
          <p className="text-sm font-medium mb-1">Export Options</p>
          <p className="text-xs text-muted-foreground">
            Choose what to include in your export
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-md border">
            <div className="flex items-center gap-3">
              <FileImage className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Images</p>
                <p className="text-xs text-muted-foreground">Generated NFT images</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
              className="rounded"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-md border">
            <div className="flex items-center gap-3">
              <FileJson className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Metadata</p>
                <p className="text-xs text-muted-foreground">JSON metadata files</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              className="rounded"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-md border">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Reports</p>
                <p className="text-xs text-muted-foreground">Rarity and analytics reports</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeReports}
              onChange={(e) => setIncludeReports(e.target.checked)}
              className="rounded"
            />
          </div>
        </div>

        {includeReports && (
          <Select
            label="Report Format"
            value={reportFormat}
            onChange={(e) => setReportFormat(e.target.value)}
            options={[
              { value: 'csv', label: 'CSV' },
              { value: 'xlsx', label: 'Excel (XLSX)' },
              { value: 'json', label: 'JSON' },
              { value: 'pdf', label: 'PDF' }
            ]}
          />
        )}

        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">
            Files will be exported to the project's output directory.
          </p>
          {currentProject && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {currentProject.outputConfig.outputDir}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
