import path from 'path'
import fs from 'fs'
import type Pino from 'pino'
import type { ProjectData } from './projectService'

export interface MetadataConfig {
  format: 'opensea' | 'magiceden' | 'erc721' | 'erc1155'
  ipfsBaseUri: string
  imageBaseUri: string
  namePrefix: string
  description: string
  externalUrl: string
  collectionName: string
  sellerFeeBasisPoints: number
  feeRecipient: string
  creator: string
}

export interface NFTMetadata {
  name: string
  description: string
  image: string
  external_url: string
  attributes: NFTAttribute[]
  properties?: Record<string, unknown>
  dna?: string
  edition?: number
  date?: number
  compiler?: string
}

export interface NFTAttribute {
  trait_type: string
  value: string
  rarity?: number
  display_type?: string
  max_value?: number
}

export class MetadataService {
  private logger: Pino.Logger

  constructor(logger: Pino.Logger) {
    this.logger = logger
  }

  generateNFTMetadata(
    tokenId: number,
    name: string,
    description: string,
    traits: { categoryName: string; assetName: string; rarityWeight: number }[],
    imageUri: string,
    format: string,
    config: Partial<MetadataConfig> = {}
  ): NFTMetadata {
    const attributes: NFTAttribute[] = traits.map(t => ({
      trait_type: t.categoryName,
      value: t.assetName,
      rarity: Math.round((1 / t.rarityWeight) * 10000) / 10000
    }))

    let metadata: NFTMetadata

    switch (format) {
      case 'magiceden':
        metadata = this.generateMagicEdenMetadata(tokenId, name, description, attributes, imageUri, config)
        break
      case 'erc721':
        metadata = this.generateERC721Metadata(tokenId, name, description, attributes, imageUri)
        break
      case 'erc1155':
        metadata = this.generateERC1155Metadata(tokenId, name, description, attributes, imageUri)
        break
      default:
        metadata = this.generateOpenSeaMetadata(tokenId, name, description, attributes, imageUri, config)
    }

    return metadata
  }

  private generateOpenSeaMetadata(
    tokenId: number,
    name: string,
    description: string,
    attributes: NFTAttribute[],
    imageUri: string,
    config: Partial<MetadataConfig>
  ): NFTMetadata {
    return {
      name: name || `#${tokenId}`,
      description: description || 'NFT from collection',
      image: imageUri,
      external_url: config.externalUrl || '',
      attributes,
      properties: {
        category: 'image',
        creators: config.creator ? [{ address: config.creator, share: 100 }] : [],
        files: [{ uri: imageUri, type: 'image/png' }]
      }
    }
  }

  private generateMagicEdenMetadata(
    tokenId: number,
    name: string,
    description: string,
    attributes: NFTAttribute[],
    imageUri: string,
    config: Partial<MetadataConfig>
  ): NFTMetadata {
    return {
      name: name || `#${tokenId}`,
      description: description || 'NFT from collection',
      image: imageUri,
      external_url: config.externalUrl || '',
      attributes,
      properties: {
        category: 'image',
        files: [{ uri: imageUri, type: 'image/png' }],
        creators: config.creator ? [{ address: config.creator, share: 100 }] : []
      },
      seller_fee_basis_points: config.sellerFeeBasisPoints || 500,
      collection: { name: config.collectionName || 'Collection' }
    } as any
  }

  private generateERC721Metadata(
    tokenId: number,
    name: string,
    description: string,
    attributes: NFTAttribute[],
    imageUri: string
  ): NFTMetadata {
    return {
      name: name || `#${tokenId}`,
      description: description || 'NFT from collection',
      image: imageUri,
      external_url: '',
      attributes,
      dna: '',
      edition: tokenId,
      date: Date.now(),
      compiler: 'NFT Generator Studio'
    }
  }

  private generateERC1155Metadata(
    tokenId: number,
    name: string,
    description: string,
    attributes: NFTAttribute[],
    imageUri: string
  ): NFTMetadata {
    return {
      name: name || `#${tokenId}`,
      description: description || 'NFT from collection',
      image: imageUri,
      external_url: '',
      attributes,
      properties: {
        tokenId,
        type: 'ERC1155'
      }
    }
  }

  async saveMetadata(
    metadata: NFTMetadata,
    tokenId: number,
    outputDir: string
  ): Promise<string> {
    const metadataDir = path.join(outputDir, 'metadata')
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir, { recursive: true })
    }

    const filePath = path.join(metadataDir, `${tokenId}.json`)
    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2), 'utf-8')
    return filePath
  }

  async saveMetadataBatch(
    metadataList: { tokenId: number; metadata: NFTMetadata }[],
    outputDir: string,
    format: string
  ): Promise<string[]> {
    const paths: string[] = []
    const metadataDir = path.join(outputDir, 'metadata')
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir, { recursive: true })
    }

    for (const item of metadataList) {
      const filePath = path.join(metadataDir, `${item.tokenId}`)
      const fullPath = format === 'opensea'
        ? `${filePath}`
        : `${filePath}.json`

      fs.writeFileSync(fullPath, JSON.stringify(item.metadata, null, 2), 'utf-8')
      paths.push(fullPath)

      if (paths.length % 100 === 0) {
        this.logger.debug({ count: paths.length }, 'Metadata batch progress')
      }
    }

    this.logger.info({ count: paths.length, format }, 'Metadata batch saved')
    return paths
  }

  async exportCollection(
    config: MetadataConfig,
    project: ProjectData,
    outputDir: string
  ): Promise<string | null> {
    const nftsDir = path.join(outputDir, 'images')
    const metadataDir = path.join(outputDir, 'metadata')

    if (!fs.existsSync(nftsDir) || !fs.existsSync(metadataDir)) {
      this.logger.error('Output directories not found')
      return null
    }

    const metadataList: { tokenId: number; metadata: NFTMetadata }[] = []
    const imageFiles = fs.readdirSync(nftsDir).filter(f => f.endsWith('.png') || f.endsWith('.webp') || f.endsWith('.avif'))

    for (const imageFile of imageFiles) {
      const tokenId = parseInt(path.basename(imageFile, path.extname(imageFile)), 10)
      if (isNaN(tokenId)) continue

      const imageUri = config.imageBaseUri
        ? `${config.imageBaseUri}/${imageFile}`
        : `ipfs://${imageFile}`

      const metadata = this.generateNFTMetadata(
        tokenId,
        `${config.namePrefix} #${tokenId}`,
        config.description,
        [], // traits would need to be loaded from generation data
        imageUri,
        config.format,
        config
      )

      metadataList.push({ tokenId, metadata })
    }

    await this.saveMetadataBatch(metadataList, outputDir, config.format)

    const collectionPath = path.join(outputDir, 'collection.json')
    const collectionMetadata = {
      name: config.collectionName,
      description: config.description,
      image: config.imageBaseUri || '',
      external_link: config.externalUrl || '',
      seller_fee_basis_points: config.sellerFeeBasisPoints || 0,
      fee_recipient: config.feeRecipient || ''
    }
    fs.writeFileSync(collectionPath, JSON.stringify(collectionMetadata, null, 2), 'utf-8')

    return outputDir
  }
}
