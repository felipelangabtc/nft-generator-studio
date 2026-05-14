import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { createHash } from 'crypto'
import type Pino from 'pino'

export interface ProcessedBaseImage {
  filePath: string
  width: number
  height: number
  format: string
  size: number
}

export interface ProcessedAsset {
  id: string
  name: string
  fileName: string
  filePath: string
  thumbnailPath: string
  hash: string
  width: number
  height: number
  fileSize: number
  hasTransparency: boolean
}

export class ImageService {
  private logger: Pino.Logger
  private supportedFormats = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'tiff']

  constructor(logger: Pino.Logger) {
    this.logger = logger
  }

  async processBaseImage(filePath: string): Promise<ProcessedBaseImage | null> {
    try {
      const metadata = await sharp(filePath).metadata()
      const ext = path.extname(filePath).toLowerCase().replace('.', '')

      if (!this.supportedFormats.includes(ext)) {
        throw new Error(`Unsupported format: ${ext}`)
      }

      const stat = fs.statSync(filePath)
      const result: ProcessedBaseImage = {
        filePath,
        width: metadata.width || 1024,
        height: metadata.height || 1024,
        format: metadata.format || 'png',
        size: stat.size
      }

      this.logger.info({ width: result.width, height: result.height, format: result.format }, 'Base image processed')
      return result
    } catch (err) {
      this.logger.error({ err, filePath }, 'Failed to process base image')
      return null
    }
  }

  async processAssets(
    filePaths: string[],
    categoryId: string,
    projectDir: string
  ): Promise<ProcessedAsset[]> {
    const assets: ProcessedAsset[] = []
    const categoryDir = path.join(projectDir, 'categories', categoryId)
    const thumbDir = path.join(projectDir, 'cache', 'thumbnails', categoryId)

    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true })
    }
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true })
    }

    for (const filePath of filePaths) {
      try {
        const ext = path.extname(filePath).toLowerCase()
        if (ext !== '.png') {
          this.logger.warn({ filePath }, 'Skipping non-PNG asset')
          continue
        }

        const metadata = await sharp(filePath).metadata()
        const stat = fs.statSync(filePath)
        const fileName = `${uuidv4()}.png`
        const destPath = path.join(categoryDir, fileName)
        const thumbName = `thumb_${fileName}`
        const thumbPath = path.join(thumbDir, thumbName)

        fs.copyFileSync(filePath, destPath)

        await sharp(filePath)
          .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toFile(thumbPath)

        const fileBuffer = fs.readFileSync(destPath)
        const hash = createHash('sha256').update(fileBuffer).digest('hex')

        const hasTransparency = metadata.hasAlpha || false

        const asset: ProcessedAsset = {
          id: uuidv4(),
          name: path.basename(filePath, path.extname(filePath)),
          fileName,
          filePath: destPath,
          thumbnailPath: thumbPath,
          hash,
          width: metadata.width || 1024,
          height: metadata.height || 1024,
          fileSize: stat.size,
          hasTransparency
        }

        assets.push(asset)
        this.logger.debug({ assetId: asset.id, name: asset.name }, 'Asset processed')
      } catch (err) {
        this.logger.error({ err, filePath }, 'Failed to process asset')
      }
    }

    return assets
  }

  async removeBackground(imagePath: string): Promise<string> {
    try {
      const ext = path.extname(imagePath)
      const outputPath = imagePath.replace(ext, `_nobg${ext}`)

      const image = sharp(imagePath)
      const metadata = await image.metadata()

      if (metadata.hasAlpha) {
        this.logger.info({ imagePath }, 'Image already has transparency')
        return imagePath
      }

      const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })

      const processed = Buffer.alloc(data.length)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const isWhite = r > 240 && g > 240 && b > 240
        processed[i] = r
        processed[i + 1] = g
        processed[i + 2] = b
        processed[i + 3] = isWhite ? 0 : 255
      }

      await sharp(processed, {
        raw: { width: info.width, height: info.height, channels: 4 }
      })
        .png()
        .toFile(outputPath)

      this.logger.info({ imagePath, outputPath }, 'Background removed')
      return outputPath
    } catch (err) {
      this.logger.error({ err, imagePath }, 'Failed to remove background')
      return imagePath
    }
  }

  async generateThumbnail(imagePath: string, size = 128): Promise<string> {
    try {
      const dir = path.dirname(imagePath)
      const ext = path.extname(imagePath)
      const thumbPath = path.join(dir, 'thumbs', `thumb_${path.basename(imagePath)}`)

      if (!fs.existsSync(path.join(dir, 'thumbs'))) {
        fs.mkdirSync(path.join(dir, 'thumbs'), { recursive: true })
      }

      if (fs.existsSync(thumbPath)) {
        return thumbPath
      }

      await sharp(imagePath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(thumbPath)

      return thumbPath
    } catch (err) {
      this.logger.error({ err, imagePath }, 'Failed to generate thumbnail')
      return imagePath
    }
  }

  async getImageMetadata(imagePath: string): Promise<Record<string, unknown> | null> {
    try {
      const metadata = await sharp(imagePath).metadata()
      const stat = fs.statSync(imagePath)
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        hasAlpha: metadata.hasAlpha,
        size: stat.size,
        space: metadata.space,
        channels: metadata.channels,
        depth: metadata.depth,
        density: metadata.density
      }
    } catch (err) {
      this.logger.error({ err, imagePath }, 'Failed to get image metadata')
      return null
    }
  }

  async composeLayers(
    layers: { filePath: string; zIndex: number }[],
    width: number,
    height: number,
    outputPath: string,
    format: 'png' | 'webp' | 'avif' = 'png',
    quality = 100
  ): Promise<string> {
    try {
      const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex)

      let composite = sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })

      const overlayBuffers = await Promise.all(
        sortedLayers.map(async (layer) => {
          const buffer = await sharp(layer.filePath)
            .resize(width, height, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .ensureAlpha()
            .toBuffer()

          return { input: buffer, top: 0, left: 0 }
        })
      )

      await composite
        .composite(overlayBuffers)
        .toFormat(format, { quality })
        .toFile(outputPath)

      this.logger.debug({ outputPath, format, layers: layers.length }, 'Image composed')
      return outputPath
    } catch (err) {
      this.logger.error({ err, outputPath }, 'Failed to compose layers')
      throw err
    }
  }

  async generatePreview(
    layers: { filePath: string; zIndex: number }[],
    width: number,
    height: number
  ): Promise<Buffer> {
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex)

    const overlayBuffers = await Promise.all(
      sortedLayers.map(async (layer) => {
        const buffer = await sharp(layer.filePath)
          .resize(width, height, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .ensureAlpha()
          .toBuffer()
        return { input: buffer, top: 0, left: 0 }
      })
    )

    const result = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite(overlayBuffers)
      .png()
      .toBuffer()

    return result
  }

  async convertImage(
    inputPath: string,
    outputPath: string,
    format: 'png' | 'webp' | 'avif',
    quality = 100
  ): Promise<string> {
    await sharp(inputPath)
      .toFormat(format, { quality })
      .toFile(outputPath)
    return outputPath
  }

  async resizeImage(
    inputPath: string,
    width: number,
    height: number,
    outputPath: string
  ): Promise<string> {
    await sharp(inputPath)
      .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(outputPath)
    return outputPath
  }

  async addWatermark(
    imagePath: string,
    text: string,
    opacity = 0.3,
    outputPath: string
  ): Promise<string> {
    const svgText = `
      <svg width="100%" height="100%">
        <style>
          .watermark { fill: white; font-size: 24px; font-family: Arial; opacity: ${opacity}; }
        </style>
        <text x="50%" y="95%" text-anchor="end" class="watermark">${text}</text>
      </svg>
    `

    await sharp(imagePath)
      .composite([{
        input: Buffer.from(svgText),
        top: 0,
        left: 0
      }])
      .toFile(outputPath)

    return outputPath
  }

  async getPixelHash(imagePath: string): Promise<string> {
    const buffer = await sharp(imagePath)
      .resize(32, 32, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer()

    const hash = createHash('md5').update(buffer).digest('hex')
    return hash
  }

  async getPerceptualHash(imagePath: string): Promise<string> {
    const size = 32
    const { data, info } = await sharp(imagePath)
      .resize(size, size, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixels: number[] = []
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        pixels.push(data[y * info.width + x])
      }
    }

    const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length
    let hash = ''
    for (const pixel of pixels) {
      hash += pixel >= avg ? '1' : '0'
    }

    return hash
  }

  getHammingDistance(hash1: string, hash2: string): number {
    let distance = 0
    for (let i = 0; i < hash1.length && i < hash2.length; i++) {
      if (hash1[i] !== hash2[i]) distance++
    }
    return distance
  }

  getSimilarity(hash1: string, hash2: string): number {
    const maxLen = Math.max(hash1.length, hash2.length)
    if (maxLen === 0) return 1
    const distance = this.getHammingDistance(hash1, hash2)
    return 1 - distance / maxLen
  }
}
