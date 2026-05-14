export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type CompatibilityType = 'exclusion' | 'requirement' | 'mutual_exclusion'

export type ExportFormat = 'png' | 'webp' | 'avif'
export type ReportFormat = 'csv' | 'xlsx' | 'pdf' | 'json'

export type ThemeMode = 'light' | 'dark' | 'system'
export type Language = 'en' | 'pt-BR'

export type GenerationStatus = 'idle' | 'preparing' | 'generating' | 'paused' | 'completed' | 'error'

export type AIProvider = 'replicate' | 'openai' | 'gemini' | 'whisk'

export interface AIConfig {
  provider: AIProvider
  replicateApiKey: string
  replicateModel: string
  openaiApiKey: string
  openaiModel: string
  geminiApiKey: string
  geminiModel: string
  whiskCookie: string
  defaultPrompt: string
  negativePrompt: string
  numInferenceSteps: number
  guidanceScale: number
}

export interface AIGenerateRequest {
  baseImagePath: string
  categoryId: string
  categoryName: string
  prompt: string
  count: number
}

export interface AIGeneratedAsset {
  id: string
  name: string
  filePath: string
  thumbnailPath: string
  prompt: string
  width: number
  height: number
}

export interface AIGenerateProgress {
  status: 'idle' | 'generating' | 'completed' | 'error'
  current: number
  total: number
  generatedAssets: AIGeneratedAsset[]
  error?: string
}

export type AssetStatus = 'active' | 'disabled'

export interface Project {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  baseImage: string | null
  canvasWidth: number
  canvasHeight: number
  categories: Category[]
  compatibilityRules: CompatibilityRule[]
  generationConfig: GenerationConfig
  outputConfig: OutputConfig
  version: number
  tags: string[]
}

export interface Category {
  id: string
  name: string
  zIndex: number
  enabled: boolean
  assets: Asset[]
}

export interface Asset {
  id: string
  name: string
  fileName: string
  filePath: string
  thumbnailPath: string
  rarityWeight: number
  rarityTier: RarityTier
  rarityScore: number
  enabled: boolean
  tags: string[]
  hash: string
  width: number
  height: number
  fileSize: number
}

export interface CompatibilityRule {
  id: string
  type: CompatibilityType
  sourceCategoryId: string
  sourceAssetId: string
  targetCategoryId: string
  targetAssetId: string
  enabled: boolean
  description: string
}

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
  outputFormat: ExportFormat
  quality: number
  namePrefix: string
  description: string
}

export interface OutputConfig {
  outputDir: string
  metadataFormat: 'opensea' | 'magiceden' | 'erc721' | 'erc1155'
  ipfsBaseUri: string
  imageBaseUri: string
  watermarkEnabled: boolean
  watermarkText: string
  watermarkOpacity: number
  createSubfolders: boolean
  batchSize: number
}

export interface GeneratedNFT {
  index: number
  tokenId: number
  name: string
  description: string
  imagePath: string
  metadataPath: string
  hash: string
  traits: Trait[]
  rarityScore: number
  rank: number
  seed: string
  createdAt: string
}

export interface Trait {
  categoryId: string
  categoryName: string
  assetId: string
  assetName: string
  rarityWeight: number
  rarityTier: RarityTier
}

export interface RarityStats {
  categoryId: string
  categoryName: string
  assets: AssetStats[]
  totalCombinations: number
}

export interface AssetStats {
  assetId: string
  assetName: string
  frequency: number
  frequencyPercent: number
  rarityWeight: number
  rarityTier: RarityTier
  rarityScore: number
  occurrences: number
}

export interface CollectionStats {
  totalGenerated: number
  uniqueCount: number
  duplicateCount: number
  totalPossible: number
  categoriesCount: number
  totalAssets: number
  rarityDistribution: Record<RarityTier, number>
  topRarest: GeneratedNFT[]
  generationTime: number
  averageRarityScore: number
}

export interface GenerationProgress {
  status: GenerationStatus
  current: number
  total: number
  percentage: number
  elapsed: number
  estimatedRemaining: number
  duplicatesFound: number
  currentNft: string | null
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  categories: Category[]
  compatibilityRules: CompatibilityRule[]
  config: Partial<GenerationConfig & OutputConfig>
  thumbnail: string | null
  createdAt: string
  usageCount: number
}

export interface PluginInfo {
  id: string
  name: string
  version: string
  description: string
  author: string
  enabled: boolean
  path: string
}

export interface AppSettings {
  theme: ThemeMode
  language: Language
  autoSave: boolean
  autoSaveInterval: number
  backupEnabled: boolean
  backupInterval: number
  maxBackups: number
  telemetryEnabled: boolean
  autoUpdate: boolean
  proxyEnabled: boolean
  proxyUrl: string
  maxParallelThreads: number
  defaultOutputFormat: ExportFormat
  defaultCanvasWidth: number
  defaultCanvasHeight: number
  recentProjects: string[]
  maxRecentProjects: number
}

export interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  details?: unknown
}

export interface ProjectFile {
  info: {
    name: string
    description: string
    createdAt: string
    updatedAt: string
    version: number
    appVersion: string
  }
  config: {
    generationConfig: GenerationConfig
    outputConfig: OutputConfig
  }
  categories: Category[]
  compatibilityRules: CompatibilityRule[]
  tags: string[]
}

export const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  totalCount: 100,
  seed: '',
  useSeed: false,
  maxRetries: 100,
  parallelThreads: 4,
  enableDeduplication: true,
  perceptualHashThreshold: 0.95,
  structuralHashThreshold: 0.9,
  generateMetadata: true,
  generateReports: true,
  outputFormat: 'png',
  quality: 100,
  namePrefix: 'NFT',
  description: ''
}

export const DEFAULT_OUTPUT_CONFIG: OutputConfig = {
  outputDir: '',
  metadataFormat: 'opensea',
  ipfsBaseUri: 'ipfs://',
  imageBaseUri: '',
  watermarkEnabled: false,
  watermarkText: 'NFT Generator',
  watermarkOpacity: 0.3,
  createSubfolders: true,
  batchSize: 100
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'replicate',
  replicateApiKey: '',
  replicateModel: 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
  openaiApiKey: '',
  openaiModel: 'dall-e-3',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash-image',
  whiskCookie: '',
  defaultPrompt: 'Create a variation of this character with different',
  negativePrompt: 'low quality, blurry, distorted, deformed, ugly, bad anatomy',
  numInferenceSteps: 30,
  guidanceScale: 7.5
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'en',
  autoSave: true,
  autoSaveInterval: 60000,
  backupEnabled: true,
  backupInterval: 300000,
  maxBackups: 10,
  telemetryEnabled: false,
  autoUpdate: true,
  proxyEnabled: false,
  proxyUrl: '',
  maxParallelThreads: 4,
  defaultOutputFormat: 'png',
  defaultCanvasWidth: 1024,
  defaultCanvasHeight: 1024,
  recentProjects: [],
  maxRecentProjects: 20
}

export const RARITY_TIER_WEIGHTS: Record<RarityTier, number> = {
  common: 40,
  uncommon: 25,
  rare: 18,
  epic: 12,
  legendary: 5
}

export const RARITY_TIER_COLORS: Record<RarityTier, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b'
}
