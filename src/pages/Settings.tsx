import { useUIStore } from '../stores/uiStore'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Label } from '../components/ui/Label'
import { Switch } from '../components/ui/Switch'
import { motion } from 'framer-motion'
import {
  Palette, Save, RefreshCw,
  Monitor, Terminal, HardDrive, Sun, Moon
} from 'lucide-react'

export function Settings() {
  const {
    theme, language, setTheme, setLanguage,
    autoSave, setAutoSave,
    telemetryEnabled, setTelemetry,
    autoUpdate, setAutoUpdate
  } = useUIStore()

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure your application preferences</p>
        </div>

        <SettingsSection
          icon={Palette}
          title="Appearance"
          description="Customize the look and feel of the application"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor }
                ].map(opt => (
                  <Button
                    key={opt.value}
                    variant={theme === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme(opt.value as any)}
                    className="flex items-center gap-2"
                  >
                    <opt.icon className="h-4 w-4" />
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <Select
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'pt-BR', label: 'Português (Brasil)' }
              ]}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon={Save}
          title="Auto Save & Backup"
          description="Configure automatic saving and backup behavior"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Save</Label>
                <p className="text-xs text-muted-foreground">Automatically save project changes</p>
              </div>
              <Switch checked={autoSave} onCheckedChange={setAutoSave} />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={RefreshCw}
          title="Updates"
          description="Software update preferences"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic Updates</Label>
                <p className="text-xs text-muted-foreground">Check for updates automatically on startup</p>
              </div>
              <Switch checked={autoUpdate} onCheckedChange={setAutoUpdate} />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={Terminal}
          title="Advanced"
          description="Advanced configuration options"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Telemetry</Label>
                <p className="text-xs text-muted-foreground">Send anonymous usage data to help improve the application</p>
              </div>
              <Switch checked={telemetryEnabled} onCheckedChange={setTelemetry} />
            </div>
          </div>
        </SettingsSection>

        <div className="pt-4 border-t">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/5">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Storage</p>
              <p className="text-xs text-muted-foreground">
                Cache size: Calculating...
                <Button variant="link" size="sm" className="h-auto p-0 ml-2 text-xs">
                  Clear Cache
                </Button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsSection({ icon: Icon, title, description, children }: {
  icon: any
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border bg-card"
    >
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-primary/5">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-medium">{title}</h2>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </motion.section>
  )
}
