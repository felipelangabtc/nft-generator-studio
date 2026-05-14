import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import Pino from 'pino'
import type { AIConfig, AIGenerateRequest, AIGeneratedAsset, AIProvider } from '../../src/types'

interface AIGenerationCallbacks {
  onProgress: (current: number, total: number) => void
  onAssetGenerated: (asset: AIGeneratedAsset) => void
  onError: (error: string) => void
}

export class AIGenerationService {
  private logger: Pino.Logger
  private configPath: string
  private config: AIConfig | null = null
  private abortController: AbortController | null = null

  constructor(userDataPath: string, logger: Pino.Logger) {
    this.logger = logger
    this.configPath = path.join(userDataPath, 'ai-config.json')
    this.loadConfig()
  }

  getConfig(): AIConfig | null {
    return this.config
  }

  saveConfig(config: AIConfig): void {
    this.config = config
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2))
    this.logger.info('AI config saved')
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8')
        this.config = JSON.parse(data) as AIConfig
        this.logger.info('AI config loaded')
      }
    } catch (err) {
      this.logger.warn({ err }, 'Failed to load AI config')
    }
  }

  async generateLayers(
    request: AIGenerateRequest,
    projectDir: string,
    callbacks: AIGenerationCallbacks
  ): Promise<AIGeneratedAsset[]> {
    if (!this.config || (!this.config.replicateApiKey && !this.config.openaiApiKey)) {
      throw new Error('AI not configured. Set your API key in Settings > AI.')
    }

    this.abortController = new AbortController()
    const generated: AIGeneratedAsset[] = []
    const categoryDir = path.join(projectDir, 'categories', request.categoryId)
    const thumbDir = path.join(projectDir, 'cache', 'thumbnails', request.categoryId)

    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true })
    }
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true })
    }

    for (let i = 0; i < request.count; i++) {
      if (this.abortController.signal.aborted) {
        throw new Error('Generation cancelled')
      }

      callbacks.onProgress(i + 1, request.count)

      try {
        const prompt = `${request.prompt} #${i + 1}`
        const imageData = await this.callAIAPI(request.baseImagePath, prompt)
        const assetId = uuidv4()
        const fileName = `${assetId}.png`
        const filePath = path.join(categoryDir, fileName)
        const thumbnailPath = path.join(thumbDir, `thumb_${fileName}`)

        const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'))

        try {
          const sharp = require('sharp')
          await sharp(filePath)
            .resize(128, 128, { fit: 'inside' })
            .toFile(thumbnailPath)
        } catch {
          fs.copyFileSync(filePath, thumbnailPath)
        }

        const metadata = { width: 1024, height: 1024 }
        try {
          const sharp = require('sharp')
          const imgMeta = await sharp(filePath).metadata()
          metadata.width = imgMeta.width || 1024
          metadata.height = imgMeta.height || 1024
        } catch {}

        const asset: AIGeneratedAsset = {
          id: assetId,
          name: `${request.categoryName}_${i + 1}`,
          filePath,
          thumbnailPath,
          prompt,
          width: metadata.width,
          height: metadata.height
        }

        generated.push(asset)
        callbacks.onAssetGenerated(asset)
      } catch (err) {
        this.logger.error({ err }, 'Failed to generate asset')
        callbacks.onError(`Failed to generate asset ${i + 1}: ${(err as Error).message}`)
      }
    }

    return generated
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  private async callAIAPI(baseImagePath: string, prompt: string): Promise<string> {
    if (!this.config) throw new Error('AI not configured')

    switch (this.config.provider) {
      case 'replicate':
        return this.callReplicate(baseImagePath, prompt)
      case 'openai':
        return this.callOpenAI(baseImagePath, prompt)
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`)
    }
  }

  private async callReplicate(baseImagePath: string, prompt: string): Promise<string> {
    const apiKey = this.config?.replicateApiKey
    if (!apiKey) throw new Error('Replicate API key not configured')

    const imageBase64 = fs.readFileSync(baseImagePath, { encoding: 'base64' })
    const dataUri = `data:image/png;base64,${imageBase64}`

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        version: this.config!.replicateModel.split(':')[1] || this.config!.replicateModel,
        input: {
          image: dataUri,
          prompt,
          negative_prompt: this.config!.negativePrompt,
          num_inference_steps: this.config!.numInferenceSteps,
          guidance_scale: this.config!.guidanceScale
        }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Replicate API error: ${response.status} ${errText}`)
    }

    const prediction = await response.json()

    if (prediction.status === 'failed') {
      throw new Error(`Replicate prediction failed: ${prediction.error}`)
    }

    if (prediction.output) {
      const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
      return this.downloadImageAsBase64(imageUrl)
    }

    return this.pollReplicateResult(prediction.id, apiKey)
  }

  private async pollReplicateResult(id: string, apiKey: string): Promise<string> {
    const maxAttempts = 60
    for (let i = 0; i < maxAttempts; i++) {
      if (this.abortController?.signal.aborted) throw new Error('Cancelled')

      await new Promise(r => setTimeout(r, 2000))

      const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })

      if (!response.ok) continue

      const prediction = await response.json()

      if (prediction.status === 'succeeded' && prediction.output) {
        const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
        return this.downloadImageAsBase64(imageUrl)
      }

      if (prediction.status === 'failed') {
        throw new Error(`Replicate prediction failed: ${prediction.error}`)
      }
    }

    throw new Error('Replicate prediction timed out')
  }

  private async callOpenAI(baseImagePath: string, prompt: string): Promise<string> {
    const apiKey = this.config?.openaiApiKey
    if (!apiKey) throw new Error('OpenAI API key not configured')

    const imageBase64 = fs.readFileSync(baseImagePath, { encoding: 'base64' })

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config!.openaiModel || 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json'
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${errText}`)
    }

    const data = await response.json()
    if (data.data?.[0]?.b64_json) {
      return `data:image/png;base64,${data.data[0].b64_json}`
    }

    throw new Error('OpenAI returned no image data')
  }

  private async downloadImageAsBase64(url: string): Promise<string> {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to download image: ${response.status}`)

    const buffer = Buffer.from(await response.arrayBuffer())
    return `data:image/png;base64,${buffer.toString('base64')}`
  }
}
