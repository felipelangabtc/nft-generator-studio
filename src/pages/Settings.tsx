import { useState, useEffect } from 'react'
import { useUIStore } from '../stores/uiStore'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Switch } from '../components/ui/Switch'
import { Slider } from '../components/ui/Slider'
import { motion } from 'framer-motion'
import { AIAPI } from '../lib/api'
import type { AIConfig } from '../types'
import { DEFAULT_AI_CONFIG } from '../types'
import {
  Palette, Save, RefreshCw,
  Monitor, Terminal, HardDrive, Sun, Moon, Brain
} from 'lucide-react'

export function Settings() {
  const {
    theme, language, setTheme, setLanguage,
    autoSave, setAutoSave,
    telemetryEnabled, setTelemetry,
    autoUpdate, setAutoUpdate
  } = useUIStore()

  const [aiConfig, setAiConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG)
  const [aiLoaded, setAiLoaded] = useState(false)
  const [aiSaved, setAiSaved] = useState(false)

  useEffect(() => {
    AIAPI.getConfig().then((config) => {
      if (config) {
        setAiConfig(config)
      }
      setAiLoaded(true)
    }).catch(() => setAiLoaded(true))
  }, [])

  const updateAIConfig = (updates: Partial<AIConfig>) => {
    setAiConfig(prev => ({ ...prev, ...updates }))
  }

  const handleSaveAIConfig = async () => {
    try {
      await AIAPI.saveConfig(aiConfig)
      setAiSaved(true)
      setTimeout(() => setAiSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save AI config', err)
    }
  }

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
          icon={Brain}
          title="AI Generation"
          description="Configure AI image generation settings for automatic layer creation"
        >
          {aiLoaded ? (
            <div className="space-y-4">
              <Select
                label="AI Provider"
                value={aiConfig.provider}
                onChange={(e) => updateAIConfig({ provider: e.target.value as any })}
                options={[
                  { value: 'replicate', label: 'Replicate (Stable Diffusion)' },
                  { value: 'openai', label: 'OpenAI (DALL-E 3)' },
                  { value: 'gemini', label: 'Google Gemini (Nano Banana)' },
                  { value: 'whisk', label: 'Google Whisk (não-oficial)' }
                ]}
              />

              {aiConfig.provider === 'replicate' && (
                <>
                  <Input
                    label="Replicate API Key"
                    type="password"
                    value={aiConfig.replicateApiKey}
                    onChange={(e) => updateAIConfig({ replicateApiKey: e.target.value })}
                    placeholder="r8_..."
                  />
                  <Input
                    label="Model Version"
                    value={aiConfig.replicateModel}
                    onChange={(e) => updateAIConfig({ replicateModel: e.target.value })}
                    placeholder="stability-ai/stable-diffusion:version"
                  />
                </>
              )}

              {aiConfig.provider === 'openai' && (
                <>
                  <Input
                    label="OpenAI API Key"
                    type="password"
                    value={aiConfig.openaiApiKey}
                    onChange={(e) => updateAIConfig({ openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                  />
                  <Select
                    label="Model"
                    value={aiConfig.openaiModel}
                    onChange={(e) => updateAIConfig({ openaiModel: e.target.value })}
                    options={[
                      { value: 'dall-e-3', label: 'DALL-E 3' },
                      { value: 'dall-e-2', label: 'DALL-E 2' }
                    ]}
                  />
                </>
              )}

              {aiConfig.provider === 'gemini' && (
                <>
                  <Input
                    label="Gemini API Key"
                    type="password"
                    value={aiConfig.geminiApiKey}
                    onChange={(e) => updateAIConfig({ geminiApiKey: e.target.value })}
                    placeholder="(obter em ai.google.dev)"
                  />
                  <Select
                    label="Model"
                    value={aiConfig.geminiModel}
                    onChange={(e) => updateAIConfig({ geminiModel: e.target.value })}
                    options={[
                      { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image' },
                      { value: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image' },
                      { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image' }
                    ]}
                  />
                </>
              )}

              {aiConfig.provider === 'whisk' && (
                <>
                  <Input
                    label="Google Account Cookie"
                    type="password"
                    value={aiConfig.whiskCookie}
                    onChange={(e) => updateAIConfig({ whiskCookie: e.target.value })}
                    placeholder="__Secure-... (cookie do Google)"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    ⚠️ Whisk foi descontinuado em abril/2026. Pode não funcionar.
                    Extraia o cookie <code>__Secure-ENID</code> do site labs.google/whisk.
                  </p>
                </>
              )}

              <div>
                <label className="text-sm font-medium">Default Prompt Template</label>
                <textarea
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1"
                  rows={2}
                  value={aiConfig.defaultPrompt}
                  onChange={(e) => updateAIConfig({ defaultPrompt: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Use {'{category}'} for the layer name. Example: "Create a {'{category}'} for this character"
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Negative Prompt</label>
                <textarea
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1"
                  rows={2}
                  value={aiConfig.negativePrompt}
                  onChange={(e) => updateAIConfig({ negativePrompt: e.target.value })}
                />
              </div>

              <Slider
                label="Inference Steps"
                value={aiConfig.numInferenceSteps}
                onChange={(v) => updateAIConfig({ numInferenceSteps: v })}
                min={10}
                max={50}
              />

              <Slider
                label="Guidance Scale"
                value={aiConfig.guidanceScale}
                onChange={(v) => updateAIConfig({ guidanceScale: v })}
                min={1}
                max={20}
                step={0.5}
              />

              <Button onClick={handleSaveAIConfig} className="w-full">
                {aiSaved ? 'Saved!' : 'Save AI Configuration'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            </div>
          )}
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
