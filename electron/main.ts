import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron'
import path from 'path'
import fs from 'fs'
import { autoUpdater } from 'electron-updater'
import Pino from 'pino'
import { ProjectService } from './services/projectService'
import { ImageService } from './services/imageService'
import { GenerationService } from './services/generationService'
import { RarityService } from './services/rarityService'
import { MetadataService } from './services/metadataService'
import { AIGenerationService } from './services/aiGenerationService'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let logger: Pino.Logger

function createLogger(): Pino.Logger {
  return Pino({
    level: isDev ? 'debug' : 'info',
    transport: isDev
      ? { target: 'pino-pretty', options: { colorize: true } }
      : { target: 'pino/file', options: { destination: path.join(app.getPath('userData'), 'logs', 'app.log') } }
  })
}

let mainWindow: BrowserWindow | null = null
let projectService: ProjectService
let imageService: ImageService
let generationService: GenerationService
let rarityService: RarityService
let metadataService: MetadataService
let aiGenerationService: AIGenerationService

function ensureDirectories(): void {
  const dirs = [
    app.getPath('userData'),
    path.join(app.getPath('userData'), 'logs'),
    path.join(app.getPath('userData'), 'projects'),
    path.join(app.getPath('userData'), 'cache'),
    path.join(app.getPath('userData'), 'backups'),
    path.join(app.getPath('userData'), 'plugins'),
    path.join(app.getPath('userData'), 'presets'),
    path.join(app.getPath('userData'), 'temp')
  ]
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'NFT Generator Studio',
    icon: path.join(__dirname, '../resources/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    },
    show: false,
    backgroundColor: '#09090b',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: 'detach' })
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  setupMenu()
}

function setupMenu(): void {
  const isMac = process.platform === 'darwin'
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:new-project')
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:open-project')
        },
        {
          label: 'Save Project',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save-project')
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu:save-project-as')
        },
        { type: 'separator' },
        {
          label: 'Import',
          submenu: [
            { label: 'Import Project...', click: () => mainWindow?.webContents.send('menu:import-project') },
            { label: 'Import Assets...', click: () => mainWindow?.webContents.send('menu:import-assets') },
            { label: 'Import PSD...', click: () => mainWindow?.webContents.send('menu:import-psd') }
          ]
        },
        {
          label: 'Export',
          submenu: [
            { label: 'Export Project...', click: () => mainWindow?.webContents.send('menu:export-project') },
            { label: 'Export Collection...', click: () => mainWindow?.webContents.send('menu:export-collection') },
            { label: 'Export Metadata...', click: () => mainWindow?.webContents.send('menu:export-metadata') }
          ]
        },
        { type: 'separator' },
        {
          label: 'Project Settings...',
          click: () => mainWindow?.webContents.send('menu:project-settings')
        },
        { type: 'separator' },
        ...(isMac ? [] : [{ label: 'Exit', role: 'quit' as const }])
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const, label: 'Undo' },
        { role: 'redo' as const, label: 'Redo' },
        { type: 'separator' },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'delete' as const },
        { type: 'separator' },
        { role: 'selectAll' as const }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' },
        { role: 'togglefullscreen' as const },
        { type: 'separator' },
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow?.webContents.send('menu:toggle-sidebar')
        },
        {
          label: 'Toggle Console',
          accelerator: 'CmdOrCtrl+`',
          click: () => mainWindow?.webContents.send('menu:toggle-console')
        }
      ]
    },
    {
      label: 'Generate',
      submenu: [
        {
          label: 'Start Generation...',
          accelerator: 'CmdOrCtrl+G',
          click: () => mainWindow?.webContents.send('menu:start-generation')
        },
        {
          label: 'Pause Generation',
          click: () => mainWindow?.webContents.send('menu:pause-generation')
        },
        {
          label: 'Stop Generation',
          click: () => mainWindow?.webContents.send('menu:stop-generation')
        },
        { type: 'separator' },
        {
          label: 'Preview Random',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.send('menu:preview-random')
        },
        {
          label: 'Clear Output',
          click: () => mainWindow?.webContents.send('menu:clear-output')
        }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Rarity Analyzer',
          click: () => mainWindow?.webContents.send('menu:rarity-analyzer')
        },
        {
          label: 'Duplicate Finder',
          click: () => mainWindow?.webContents.send('menu:duplicate-finder')
        },
        { type: 'separator' },
        {
          label: 'Batch Operations',
          click: () => mainWindow?.webContents.send('menu:batch-operations')
        },
        {
          label: 'Template Manager',
          click: () => mainWindow?.webContents.send('menu:template-manager')
        },
        { type: 'separator' },
        {
          label: 'Plugin Manager',
          click: () => mainWindow?.webContents.send('menu:plugin-manager')
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://nft-generator-studio.dev/docs')
        },
        {
          label: 'API Reference',
          click: () => shell.openExternal('https://nft-generator-studio.dev/api')
        },
        { type: 'separator' },
        {
          label: 'Release Notes',
          click: () => shell.openExternal('https://github.com/nft-generator/nft-generator-studio/releases')
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/nft-generator/nft-generator-studio/issues')
        },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About NFT Generator Studio',
              message: 'NFT Generator Studio v1.0.0',
              detail: 'Professional NFT PFP Collection Generator\n\nBuilt with Electron, React, and TypeScript'
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function setupIpcHandlers(): void {
  projectService = new ProjectService(app.getPath('userData'), logger)
  imageService = new ImageService(logger)
  rarityService = new RarityService(logger)
  metadataService = new MetadataService(logger)
  generationService = new GenerationService(imageService, metadataService, logger)
  aiGenerationService = new AIGenerationService(app.getPath('userData'), logger)

  ipcMain.handle('project:create', async (_, data) => {
    return projectService.create(data)
  })

  ipcMain.handle('project:open', async (_, id: string) => {
    return projectService.open(id)
  })

  ipcMain.handle('project:save', async (_, project) => {
    return projectService.save(project)
  })

  ipcMain.handle('project:saveAs', async (_, project) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Save Project As',
      defaultPath: path.join(app.getPath('documents'), `${project.name}.nftproj`),
      filters: [{ name: 'NFT Project Files', extensions: ['nftproj'] }]
    })
    if (!result.canceled && result.filePath) {
      return projectService.saveAs(project, result.filePath)
    }
    return null
  })

  ipcMain.handle('project:list', async () => {
    return projectService.list()
  })

  ipcMain.handle('project:delete', async (_, id: string) => {
    return projectService.delete(id)
  })

  ipcMain.handle('project:duplicate', async (_, id: string) => {
    return projectService.duplicate(id)
  })

  ipcMain.handle('project:export', async (_, id: string) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Export Project',
      filters: [{ name: 'NFT Project Archive', extensions: ['nftproj.zip'] }]
    })
    if (!result.canceled && result.filePath) {
      return projectService.export(id, result.filePath)
    }
    return null
  })

  ipcMain.handle('project:import', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Import Project',
      filters: [{ name: 'NFT Project Files', extensions: ['nftproj', 'nftproj.zip'] }],
      properties: ['openFile']
    })
    if (!result.canceled && result.filePaths[0]) {
      return projectService.import(result.filePaths[0])
    }
    return null
  })

  ipcMain.handle('image:selectBase', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Select Base Image',
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'psd'] }
      ],
      properties: ['openFile']
    })
    if (!result.canceled && result.filePaths[0]) {
      return imageService.processBaseImage(result.filePaths[0])
    }
    return null
  })

  ipcMain.handle('image:uploadAssets', async (_, categoryId: string) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Select Asset Images',
      filters: [{ name: 'PNG Images', extensions: ['png'] }],
      properties: ['openFile', 'multiSelections']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const projectDir = projectService.getCurrentProjectDir()
      if (!projectDir) throw new Error('No project open')
      return imageService.processAssets(result.filePaths, categoryId, projectDir)
    }
    return null
  })

  ipcMain.handle('image:removeBackground', async (_, imagePath: string) => {
    return imageService.removeBackground(imagePath)
  })

  ipcMain.handle('image:getThumbnail', async (_, imagePath: string, size?: number) => {
    return imageService.generateThumbnail(imagePath, size)
  })

  ipcMain.handle('image:getMetadata', async (_, imagePath: string) => {
    return imageService.getImageMetadata(imagePath)
  })

  ipcMain.handle('generation:start', async (_, config) => {
    const project = projectService.getCurrentProject()
    if (!project) throw new Error('No project open')
    return generationService.start(config, project, projectService.getCurrentProjectDir()!)
  })

  ipcMain.handle('generation:pause', async () => {
    return generationService.pause()
  })

  ipcMain.handle('generation:resume', async () => {
    return generationService.resume()
  })

  ipcMain.handle('generation:stop', async () => {
    return generationService.stop()
  })

  ipcMain.handle('generation:status', async () => {
    return generationService.getStatus()
  })

  ipcMain.handle('generation:preview', async (_, seed?: string) => {
    const project = projectService.getCurrentProject()
    if (!project) throw new Error('No project open')
    return generationService.generatePreview(project, seed)
  })

  ipcMain.handle('rarity:calculate', async () => {
    const project = projectService.getCurrentProject()
    if (!project) throw new Error('No project open')
    return rarityService.calculateStats(project)
  })

  ipcMain.handle('rarity:normalize', async () => {
    const project = projectService.getCurrentProject()
    if (!project) throw new Error('No project open')
    return rarityService.normalizeWeights(project)
  })

  ipcMain.handle('metadata:export', async (_, config) => {
    const project = projectService.getCurrentProject()
    if (!project) throw new Error('No project open')
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Select Metadata Export Directory',
      properties: ['openDirectory']
    })
    if (!result.canceled && result.filePaths[0]) {
      return metadataService.exportCollection(config, project, result.filePaths[0])
    }
    return null
  })

  ipcMain.handle('ai:getConfig', async () => {
    return aiGenerationService.getConfig()
  })

  ipcMain.handle('ai:saveConfig', async (_, config) => {
    return aiGenerationService.saveConfig(config)
  })

  ipcMain.handle('ai:generateLayers', async (_, request) => {
    const project = projectService.getCurrentProject()
    if (!project) throw new Error('No project open')
    const projectDir = projectService.getCurrentProjectDir()
    if (!projectDir) throw new Error('No project directory')
    return aiGenerationService.generateLayers(request, projectDir, {
      onProgress: () => {},
      onAssetGenerated: () => {},
      onError: (msg) => logger.warn({ msg }, 'AI generation warning')
    })
  })

  ipcMain.handle('ai:cancel', async () => {
    return aiGenerationService.cancel()
  })

  ipcMain.handle('report:generate', async (_, format) => {
    const project = projectService.getCurrentProject()
    if (!project) throw new Error('No project open')
    return rarityService.generateReport(project, format)
  })

  ipcMain.handle('dialog:openFile', async (_, options) => {
    const result = await dialog.showOpenDialog(mainWindow!, options)
    return result
  })

  ipcMain.handle('dialog:saveFile', async (_, options) => {
    const result = await dialog.showSaveDialog(mainWindow!, options)
    return result
  })

  ipcMain.handle('dialog:selectDirectory', async (_, options) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      ...options,
      properties: ['openDirectory']
    })
    return result
  })

  ipcMain.handle('app:getPath', async (_, name: string) => {
    return app.getPath(name as any)
  })

  ipcMain.handle('app:getVersion', () => app.getVersion())
  ipcMain.handle('app:getPlatform', () => process.platform)
  ipcMain.handle('app:isDev', () => isDev)

  ipcMain.handle('shell:openExternal', async (_, url: string) => {
    return shell.openExternal(url)
  })

  ipcMain.handle('fs:readFile', async (_, filePath: string, encoding?: string) => {
    return fs.promises.readFile(filePath, encoding as any)
  })

  ipcMain.handle('fs:writeFile', async (_, filePath: string, data: any) => {
    return fs.promises.writeFile(filePath, data)
  })

  ipcMain.handle('fs:readDir', async (_, dirPath: string) => {
    return fs.promises.readdir(dirPath, { withFileTypes: true })
  })

  ipcMain.handle('fs:makeDir', async (_, dirPath: string) => {
    return fs.promises.mkdir(dirPath, { recursive: true })
  })

  ipcMain.handle('fs:exists', async (_, filePath: string) => {
    return fs.existsSync(filePath)
  })

  ipcMain.handle('fs:deleteFile', async (_, filePath: string) => {
    return fs.promises.unlink(filePath)
  })

  ipcMain.handle('fs:deleteDir', async (_, dirPath: string) => {
    return fs.promises.rm(dirPath, { recursive: true, force: true })
  })

  ipcMain.handle('fs:copyFile', async (_, src: string, dest: string) => {
    return fs.promises.copyFile(src, dest)
  })

  ipcMain.handle('fs:rename', async (_, oldPath: string, newPath: string) => {
    return fs.promises.rename(oldPath, newPath)
  })

  ipcMain.handle('fs:stat', async (_, filePath: string) => {
    const stat = await fs.promises.stat(filePath)
    return {
      size: stat.size,
      isFile: stat.isFile(),
      isDirectory: stat.isDirectory(),
      createdAt: stat.birthtime.toISOString(),
      modifiedAt: stat.mtime.toISOString()
    }
  })

  ipcMain.handle('update:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return result
    } catch {
      return null
    }
  })

  ipcMain.handle('update:download', async () => {
    autoUpdater.downloadUpdate()
  })

  ipcMain.handle('update:install', async () => {
    autoUpdater.quitAndInstall()
  })
}

autoUpdater.on('checking-for-update', () => {
  mainWindow?.webContents.send('update:checking')
})

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update:available', info)
})

autoUpdater.on('update-not-available', (info) => {
  mainWindow?.webContents.send('update:not-available', info)
})

autoUpdater.on('download-progress', (progress) => {
  mainWindow?.webContents.send('update:progress', progress)
})

autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('update:downloaded', info)
})

app.whenReady().then(() => {
  ensureDirectories()
  logger = createLogger()
  createWindow()
  setupIpcHandlers()
  logger.info('Application started')

  if (!isDev) {
    autoUpdater.checkForUpdates()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  generationService?.stop()
  logger.info('Application shutting down')
})
