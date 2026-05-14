import path from 'path'
import fs from 'fs'
import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'
import type Pino from 'pino'
import type { ProjectData, CategoryData, AssetData } from './projectService'

export interface RarityStats {
  categories: CategoryRarityStats[]
  totalCombinations: number
  totalAssets: number
  rarityDistribution: Record<string, number>
  averageRarityScore: number
}

export interface CategoryRarityStats {
  categoryId: string
  categoryName: string
  assetCount: number
  totalWeight: number
  assets: AssetRarityStats[]
}

export interface AssetRarityStats {
  assetId: string
  assetName: string
  weight: number
  weightPercent: number
  tier: string
  score: number
  probability: number
}

export class RarityService {
  private logger: Pino.Logger

  constructor(logger: Pino.Logger) {
    this.logger = logger
  }

  calculateStats(project: ProjectData): RarityStats {
    const categories: CategoryRarityStats[] = []
    let totalCombinations = 1
    let totalAssets = 0
    const rarityDistribution: Record<string, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    }

    for (const category of project.categories) {
      if (!category.enabled || category.assets.length === 0) continue

      const enabledAssets = category.assets.filter(a => a.enabled)
      if (enabledAssets.length === 0) continue

      totalCombinations *= enabledAssets.length
      totalAssets += enabledAssets.length

      const totalWeight = enabledAssets.reduce((sum, a) => sum + a.rarityWeight, 0)

      const assetStats: AssetRarityStats[] = enabledAssets.map(asset => {
        const weightPercent = totalWeight > 0 ? (asset.rarityWeight / totalWeight) * 100 : 0
        const probability = totalWeight > 0 ? asset.rarityWeight / totalWeight : 0
        const score = 1 / (probability || 0.001)

        rarityDistribution[asset.rarityTier] = (rarityDistribution[asset.rarityTier] || 0) + 1

        return {
          assetId: asset.id,
          assetName: asset.name,
          weight: asset.rarityWeight,
          weightPercent,
          tier: asset.rarityTier,
          score,
          probability
        }
      })

      categories.push({
        categoryId: category.id,
        categoryName: category.name,
        assetCount: enabledAssets.length,
        totalWeight,
        assets: assetStats
      })
    }

    const allScores = categories.flatMap(c => c.assets.map(a => a.score))
    const averageRarityScore = allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0

    return {
      categories,
      totalCombinations,
      totalAssets,
      rarityDistribution,
      averageRarityScore
    }
  }

  normalizeWeights(project: ProjectData): ProjectData {
    const updated = { ...project, categories: [...project.categories] }

    for (let i = 0; i < updated.categories.length; i++) {
      const category = { ...updated.categories[i], assets: [...updated.categories[i].assets] }
      const enabledAssets = category.assets.filter(a => a.enabled)

      if (enabledAssets.length === 0) continue

      const totalWeight = enabledAssets.reduce((sum, a) => sum + a.rarityWeight, 0)
      const equalWeight = totalWeight > 0 ? totalWeight / enabledAssets.length : 100 / enabledAssets.length

      for (let j = 0; j < category.assets.length; j++) {
        if (category.assets[j].enabled) {
          category.assets[j] = {
            ...category.assets[j],
            rarityWeight: equalWeight
          }
        }
      }

      updated.categories[i] = category
    }

    return updated
  }

  async generateReport(project: ProjectData, format: string): Promise<string | null> {
    const stats = this.calculateStats(project)
    const outputDir = path.join(project.filePath, 'output', 'reports')

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    switch (format) {
      case 'csv':
        return this.generateCsvReport(stats, outputDir)
      case 'json':
        return this.generateJsonReport(stats, outputDir)
      case 'xlsx':
        return this.generateExcelReport(stats, outputDir)
      case 'pdf':
        return this.generatePdfReport(stats, outputDir)
      default:
        return this.generateCsvReport(stats, outputDir)
    }
  }

  private generateCsvReport(stats: RarityStats, outputDir: string): string {
    const filePath = path.join(outputDir, 'rarity_report.csv')
    const lines: string[] = [
      'Category,Asset,Weight,Weight%,Tier,Rarity Score,Probability'
    ]

    for (const category of stats.categories) {
      for (const asset of category.assets) {
        lines.push(
          `${category.categoryName},${asset.assetName},${asset.weight},${asset.weightPercent.toFixed(2)}%,${asset.tier},${asset.score.toFixed(4)},${(asset.probability * 100).toFixed(4)}%`
        )
      }
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')
    this.logger.info({ filePath }, 'CSV report generated')
    return filePath
  }

  private generateJsonReport(stats: RarityStats, outputDir: string): string {
    const filePath = path.join(outputDir, 'rarity_report.json')
    fs.writeFileSync(filePath, JSON.stringify(stats, null, 2), 'utf-8')
    this.logger.info({ filePath }, 'JSON report generated')
    return filePath
  }

  private async generateExcelReport(stats: RarityStats, outputDir: string): Promise<string> {
    const filePath = path.join(outputDir, 'rarity_report.xlsx')
    try {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Rarity Report')

      sheet.columns = [
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Asset', key: 'asset', width: 25 },
        { header: 'Weight', key: 'weight', width: 10 },
        { header: 'Weight %', key: 'weightPercent', width: 12 },
        { header: 'Tier', key: 'tier', width: 12 },
        { header: 'Rarity Score', key: 'score', width: 15 },
        { header: 'Probability', key: 'probability', width: 12 }
      ]

      for (const category of stats.categories) {
        for (const asset of category.assets) {
          sheet.addRow({
            category: category.categoryName,
            asset: asset.assetName,
            weight: asset.weight,
            weightPercent: `${asset.weightPercent.toFixed(2)}%`,
            tier: asset.tier,
            score: asset.score.toFixed(4),
            probability: `${(asset.probability * 100).toFixed(4)}%`
          })
        }
      }

      sheet.getRow(1).font = { bold: true }
      await workbook.xlsx.writeFile(filePath)
      this.logger.info({ filePath }, 'Excel report generated')
    } catch (err) {
      this.logger.error({ err }, 'Failed to generate Excel report, falling back to CSV')
      return this.generateCsvReport(stats, outputDir)
    }
    return filePath
  }

  private async generatePdfReport(stats: RarityStats, outputDir: string): Promise<string> {
    const filePath = path.join(outputDir, 'rarity_report.pdf')
    try {
      const doc = new jsPDF()
      let y = 20

      doc.setFontSize(18)
      doc.text('Rarity Report', 20, y)
      y += 10

      doc.setFontSize(12)
      doc.text(`Total Combinations: ${stats.totalCombinations.toLocaleString()}`, 20, y)
      y += 8
      doc.text(`Total Assets: ${stats.totalAssets}`, 20, y)
      y += 8
      doc.text(`Average Rarity Score: ${stats.averageRarityScore.toFixed(4)}`, 20, y)
      y += 15

      doc.setFontSize(14)
      doc.text('Rarity Distribution', 20, y)
      y += 10

      doc.setFontSize(10)
      for (const [tier, count] of Object.entries(stats.rarityDistribution)) {
        doc.text(`${tier}: ${count}`, 30, y)
        y += 7
      }

      y += 10
      doc.setFontSize(14)
      doc.text('Asset Breakdown', 20, y)
      y += 10

      doc.setFontSize(8)
      for (const category of stats.categories) {
        if (y > 260) {
          doc.addPage()
          y = 20
        }
        doc.setFontSize(10)
        doc.text(category.categoryName, 20, y)
        y += 6
        doc.setFontSize(8)

        for (const asset of category.assets) {
          if (y > 270) {
            doc.addPage()
            y = 20
          }
          doc.text(
            `  ${asset.assetName} - ${asset.weightPercent.toFixed(1)}% - ${asset.tier} - Score: ${asset.score.toFixed(2)}`,
            25, y
          )
          y += 5
        }
        y += 3
      }

      doc.save(filePath)
      this.logger.info({ filePath }, 'PDF report generated')
    } catch (err) {
      this.logger.error({ err }, 'Failed to generate PDF report, falling back to CSV')
      return this.generateCsvReport(stats, outputDir)
    }
    return filePath
  }
}
