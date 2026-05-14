import path from 'path'
import fs from 'fs'
import { createHash } from 'crypto'
import { Worker } from 'worker_threads'
import type Pino from 'pino'
import type { ProjectData, CategoryData } from './projectService'
import type { ImageService } from './imageService'
import type { MetadataService, MetadataConfig } from './metadataService'

export interface GenerationConfig {
  totalCount: number
  seed: string
  useSeed: boolean
  maxRetries: number
  parallelThreads: number
  enableDeduplication: boolean
  perceptualHashThreshold: number
  structuralHashThreshold: number
  generateMetadata: boolean
  generateReports: boolean
  outputFormat: 'png' | 'webp' | 'avif'
  quality: number
  namePrefix: string
  description: string
}

export interface GenerationProgress {
  status: 'idle' | 'preparing' | 'generating' | 'paused' | 'completed' | 'error'
  current: number
  total: number
  percentage: number
  elapsed: number
  estimatedRemaining: number
  duplicatesFound: number
  currentNft: string | null
  error?: string
}

export interface GeneratedNFTData {
  index: number
  tokenId: number
  name: string
  description: string
  imagePath: string
  metadataPath: string
  hash: string
  traits: { categoryId: string; categoryName: string; assetId: string; assetName: string; rarityWeight: number; rarityTier: string }[]
  rarityScore: number
  seed: string
  createdAt: string
}

export class GenerationService {
  private imageService: ImageService
  private metadataService: MetadataService
  private logger: Pino.Logger
  private abortController: AbortController | null = null
  private isPaused = false
  private progress: GenerationProgress = {
    status: 'idle',
    current: 0,
    total: 0,
    percentage: 0,
    elapsed: 0,
    estimatedRemaining: 0,
    duplicatesFound: 0,
    currentNft: null
  }
  private startTime = 0
  private generatedHashes: Set<string> = new Set()

  constructor(imageService: ImageService, metadataService: MetadataService, logger: Pino.Logger) {
    this.imageService = imageService
    this.metadataService = metadataService
    this.logger = logger
  }

  async start(config: GenerationConfig, project: ProjectData, projectDir: string): Promise<void> {
    if (this.progress.status === 'generating') {
      throw new Error('Generation already in progress')
    }

    this.abortController = new AbortController()
    this.isPaused = false
    this.generatedHashes = new Set()
    this.startTime = Date.now()

    this.progress = {
      status: 'preparing',
      current: 0,
      total: config.totalCount,
      percentage: 0,
      elapsed: 0,
      estimatedRemaining: 0,
      duplicatesFound: 0,
      currentNft: null
    }

    try {
      this.logger.info({ total: config.totalCount }, 'Starting generation')

      const enabledCategories = project.categories.filter(
        c => c.enabled && c.assets.some(a => a.enabled)
      )

      if (enabledCategories.length === 0) {
        throw new Error('No enabled categories with assets')
      }

      const outputDir = path.join(projectDir, 'output', 'images')
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      this.progress.status = 'generating'

      const allGenerated: GeneratedNFTData[] = []
      let duplicates = 0
      let attempts = 0
      const maxAttempts = config.totalCount + config.maxRetries

      while (allGenerated.length < config.totalCount && attempts < maxAttempts) {
        if (this.abortController?.signal.aborted) {
          this.progress.status = 'error'
          this.progress.error = 'Generation cancelled'
          return
        }

        while (this.isPaused) {
          await this.sleep(100)
          if (this.abortController?.signal.aborted) return
        }

        attempts++

        const nftData = await this.generateSingleNFT(
          enabledCategories,
          project,
          config,
          outputDir,
          projectDir,
          attempts
        )

        if (nftData) {
          const isDuplicate = await this.checkDuplicates(
            nftData,
            config,
            allGenerated
          )

          if (isDuplicate) {
            duplicates++
            this.progress.duplicatesFound = duplicates
            this.logger.debug({ attempt: attempts }, 'Duplicate found, retrying')
            continue
          }

          allGenerated.push(nftData)
          this.generatedHashes.add(nftData.hash)

          this.progress.current = allGenerated.length
          this.progress.percentage = (allGenerated.length / config.totalCount) * 100
          this.progress.currentNft = nftData.name

          const elapsed = Date.now() - this.startTime
          this.progress.elapsed = elapsed
          this.progress.estimatedRemaining = (elapsed / allGenerated.length) * (config.totalCount - allGenerated.length)

          if (allGenerated.length % 10 === 0) {
            this.logger.info({
              generated: allGenerated.length,
              total: config.totalCount,
              duplicates,
              percentage: this.progress.percentage.toFixed(1)
            }, 'Generation progress')
          }
        }
      }

      this.progress.status = 'completed'
      this.progress.percentage = 100

      if (config.generateMetadata) {
        await this.exportMetadata(allGenerated, projectDir, config)
      }

      if (config.generateReports) {
        await this.generateGenerationLog(allGenerated, projectDir, config, duplicates)
      }

      this.logger.info({
        generated: allGenerated.length,
        duplicates,
        elapsed: Date.now() - this.startTime
      }, 'Generation completed')
    } catch (err) {
      this.progress.status = 'error'
      this.progress.error = (err as Error).message
      this.logger.error({ err }, 'Generation failed')
      throw err
    }
  }

  private async generateSingleNFT(
    categories: CategoryData[],
    project: ProjectData,
    config: GenerationConfig,
    outputDir: string,
    projectDir: string,
    attempt: number
  ): Promise<GeneratedNFTData | null> {
    try {
      const seed = config.useSeed && config.seed
        ? `${config.seed}-${attempt}`
        : `${Date.now()}-${Math.random()}-${attempt}`

      const rng = this.seededRandom(this.hashString(seed))

      const traits: GeneratedNFTData['traits'] = []
      const layers: { filePath: string; zIndex: number }[] = []

      for (const category of categories) {
        const enabledAssets = category.assets.filter(a => a.enabled)
        if (enabledAssets.length === 0) continue

        const selected = this.weightedSelect(enabledAssets, rng)
        if (!selected) continue

        traits.push({
          categoryId: category.id,
          categoryName: category.name,
          assetId: selected.id,
          assetName: selected.name,
          rarityWeight: selected.rarityWeight,
          rarityTier: selected.rarityTier
        })

        layers.push({
          filePath: selected.filePath,
          zIndex: category.zIndex
        })
      }

      if (traits.length === 0) return null

      const tokenId = attempt
      const name = `${config.namePrefix || 'NFT'} #${tokenId}`
      const imageFileName = `${tokenId}.${config.outputFormat}`
      const imagePath = path.join(outputDir, imageFileName)

      await this.imageService.composeLayers(
        layers,
        project.canvasWidth,
        project.canvasHeight,
        imagePath,
        config.outputFormat,
        config.quality
      )

      const hash = await this.imageService.getPerceptualHash(imagePath)

      const rarityScore = traits.reduce((score, t) => {
        return score + (1 / (t.rarityWeight || 0.001))
      }, 0)

      return {
        index: tokenId,
        tokenId,
        name,
        description: config.description || '',
        imagePath,
        metadataPath: '',
        hash,
        traits,
        rarityScore,
        seed,
        createdAt: new Date().toISOString()
      }
    } catch (err) {
      this.logger.error({ err, attempt }, 'Failed to generate single NFT')
      return null
    }
  }

  private async checkDuplicates(
    nft: GeneratedNFTData,
    config: GenerationConfig,
    existing: GeneratedNFTData[]
  ): Promise<boolean> {
    if (!config.enableDeduplication) return false

    if (this.generatedHashes.has(nft.hash)) return true

    for (const existingNft of existing) {
      const similarity = this.imageService.getSimilarity(nft.hash, existingNft.hash)
      if (similarity >= config.perceptualHashThreshold) {
        return true
      }
    }

    return false
  }

  async pause(): Promise<void> {
    this.isPaused = true
    this.progress.status = 'paused'
    this.logger.info('Generation paused')
  }

  async resume(): Promise<void> {
    this.isPaused = false
    this.progress.status = 'generating'
    this.logger.info('Generation resumed')
  }

  async stop(): Promise<void> {
    this.abortController?.abort()
    this.isPaused = false
    this.progress.status = 'idle'
    this.logger.info('Generation stopped')
  }

  getStatus(): GenerationProgress {
    return { ...this.progress }
  }

  async generatePreview(project: ProjectData, seed?: string): Promise<string | null> {
    const enabledCategories = project.categories.filter(
      c => c.enabled && c.assets.some(a => a.enabled)
    )

    if (enabledCategories.length === 0) return null

    const previewSeed = seed || `${Date.now()}`
    const rng = this.seededRandom(this.hashString(previewSeed))

    const layers: { filePath: string; zIndex: number }[] = []

    for (const category of enabledCategories) {
      const enabledAssets = category.assets.filter(a => a.enabled)
      if (enabledAssets.length === 0) continue

      const selected = this.weightedSelect(enabledAssets, rng)
      if (!selected) continue

      layers.push({
        filePath: selected.filePath,
        zIndex: category.zIndex
      })
    }

    try {
      const buffer = await this.imageService.generatePreview(
        layers,
        project.canvasWidth,
        project.canvasHeight
      )

      const previewDir = path.join(project.filePath, 'cache')
      if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir, { recursive: true })
      }

      const previewPath = path.join(previewDir, 'preview.png')
      fs.writeFileSync(previewPath, buffer)

      return previewPath
    } catch (err) {
      this.logger.error({ err }, 'Failed to generate preview')
      return null
    }
  }

  private async exportMetadata(
    nfts: GeneratedNFTData[],
    projectDir: string,
    config: GenerationConfig
  ): Promise<void> {
    const metadataDir = path.join(projectDir, 'output', 'metadata')
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir, { recursive: true })
    }

    const metadataConfig: Partial<MetadataConfig> = {
      format: 'opensea',
      namePrefix: config.namePrefix || 'NFT',
      description: config.description || ''
    }

    for (const nft of nfts) {
      const imageUri = `${nft.tokenId}.${config.outputFormat}`
      const metadata = this.metadataService.generateNFTMetadata(
        nft.tokenId,
        nft.name,
        nft.description,
        nft.traits.map(t => ({
          categoryName: t.categoryName,
          assetName: t.assetName,
          rarityWeight: t.rarityWeight
        })),
        imageUri,
        'opensea',
        metadataConfig
      )

      const metadataPath = path.join(metadataDir, `${nft.tokenId}.json`)
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8')
      nft.metadataPath = metadataPath
    }

    this.logger.info({ count: nfts.length }, 'Metadata exported')
  }

  private async generateGenerationLog(
    nfts: GeneratedNFTData[],
    projectDir: string,
    config: GenerationConfig,
    duplicates: number
  ): Promise<void> {
    const logPath = path.join(projectDir, 'output', 'reports', 'generation_log.txt')
    const logDir = path.dirname(logPath)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    const lines: string[] = [
      '=== NFT Generation Log ===',
      `Date: ${new Date().toISOString()}`,
      `Total Generated: ${nfts.length}`,
      `Duplicates Found: ${duplicates}`,
      `Output Format: ${config.outputFormat}`,
      `Canvas: ${1024}x${1024}`,
      `Seed: ${config.seed || 'Random'}`,
      '---',
      ''
    ]

    for (const nft of nfts) {
      lines.push(`Token #${nft.tokenId}: ${nft.name}`)
      lines.push(`  Seed: ${nft.seed}`)
      lines.push(`  Hash: ${nft.hash}`)
      lines.push(`  Rarity Score: ${nft.rarityScore.toFixed(4)}`)
      lines.push('  Traits:')
      for (const trait of nft.traits) {
        lines.push(`    ${trait.categoryName}: ${trait.assetName} (${trait.rarityTier})`)
      }
      lines.push('')
    }

    fs.writeFileSync(logPath, lines.join('\n'), 'utf-8')
    this.logger.info({ logPath }, 'Generation log saved')
  }

  private seededRandom(seed: number): () => number {
    let s = seed
    return () => {
      s = (s * 16807) % 2147483647
      return (s - 1) / 2147483646
    }
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash |= 0
    }
    return Math.abs(hash)
  }

  private weightedSelect<T extends { rarityWeight: number }>(items: T[], random: () => number): T {
    const totalWeight = items.reduce((sum, item) => sum + item.rarityWeight, 0)
    let r = random() * totalWeight
    for (const item of items) {
      r -= item.rarityWeight
      if (r <= 0) return item
    }
    return items[items.length - 1]
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
