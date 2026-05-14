import { contextBridge, ipcRenderer } from 'electron'
import type { OpenDialogOptions, SaveDialogOptions } from 'electron'

const api = {
  project: {
    create: (data: any) => ipcRenderer.invoke('project:create', data),
    open: (id: string) => ipcRenderer.invoke('project:open', id),
    save: (project: any) => ipcRenderer.invoke('project:save', project),
    saveAs: (project: any) => ipcRenderer.invoke('project:saveAs', project),
    list: () => ipcRenderer.invoke('project:list'),
    delete: (id: string) => ipcRenderer.invoke('project:delete', id),
    duplicate: (id: string) => ipcRenderer.invoke('project:duplicate', id),
    export: (id: string) => ipcRenderer.invoke('project:export', id),
    import: () => ipcRenderer.invoke('project:import')
  },

  image: {
    selectBase: () => ipcRenderer.invoke('image:selectBase'),
    uploadAssets: (categoryId: string) => ipcRenderer.invoke('image:uploadAssets', categoryId),
    removeBackground: (imagePath: string) => ipcRenderer.invoke('image:removeBackground', imagePath),
    getThumbnail: (imagePath: string, size?: number) => ipcRenderer.invoke('image:getThumbnail', imagePath, size),
    getMetadata: (imagePath: string) => ipcRenderer.invoke('image:getMetadata', imagePath)
  },

  generation: {
    start: (config: any) => ipcRenderer.invoke('generation:start', config),
    pause: () => ipcRenderer.invoke('generation:pause'),
    resume: () => ipcRenderer.invoke('generation:resume'),
    stop: () => ipcRenderer.invoke('generation:stop'),
    status: () => ipcRenderer.invoke('generation:status'),
    preview: (seed?: string) => ipcRenderer.invoke('generation:preview', seed)
  },

  rarity: {
    calculate: () => ipcRenderer.invoke('rarity:calculate'),
    normalize: () => ipcRenderer.invoke('rarity:normalize')
  },

  metadata: {
    export: (config: any) => ipcRenderer.invoke('metadata:export', config)
  },

  report: {
    generate: (format: string) => ipcRenderer.invoke('report:generate', format)
  },

  dialog: {
    openFile: (options: OpenDialogOptions) => ipcRenderer.invoke('dialog:openFile', options),
    saveFile: (options: SaveDialogOptions) => ipcRenderer.invoke('dialog:saveFile', options),
    selectDirectory: (options?: OpenDialogOptions) => ipcRenderer.invoke('dialog:selectDirectory', options)
  },

  app: {
    getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
    isDev: () => ipcRenderer.invoke('app:isDev')
  },

  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url)
  },

  fs: {
    readFile: (filePath: string, encoding?: string) => ipcRenderer.invoke('fs:readFile', filePath, encoding),
    writeFile: (filePath: string, data: any) => ipcRenderer.invoke('fs:writeFile', filePath, data),
    readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
    makeDir: (dirPath: string) => ipcRenderer.invoke('fs:makeDir', dirPath),
    exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
    deleteFile: (filePath: string) => ipcRenderer.invoke('fs:deleteFile', filePath),
    deleteDir: (dirPath: string) => ipcRenderer.invoke('fs:deleteDir', dirPath),
    copyFile: (src: string, dest: string) => ipcRenderer.invoke('fs:copyFile', src, dest),
    rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    stat: (filePath: string) => ipcRenderer.invoke('fs:stat', filePath)
  },

  update: {
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    onChecking: (cb: () => void) => { const handler = () => cb(); ipcRenderer.on('update:checking', handler); return () => ipcRenderer.removeListener('update:checking', handler) },
    onAvailable: (cb: (info: any) => void) => { const handler = (_: any, info: any) => cb(info); ipcRenderer.on('update:available', handler); return () => ipcRenderer.removeListener('update:available', handler) },
    onNotAvailable: (cb: (info: any) => void) => { const handler = (_: any, info: any) => cb(info); ipcRenderer.on('update:not-available', handler); return () => ipcRenderer.removeListener('update:not-available', handler) },
    onProgress: (cb: (progress: any) => void) => { const handler = (_: any, p: any) => cb(p); ipcRenderer.on('update:progress', handler); return () => ipcRenderer.removeListener('update:progress', handler) },
    onDownloaded: (cb: (info: any) => void) => { const handler = (_: any, info: any) => cb(info); ipcRenderer.on('update:downloaded', handler); return () => ipcRenderer.removeListener('update:downloaded', handler) }
  },

  on: (channel: string, cb: (...args: any[]) => void) => {
    const listener = (_: any, ...args: any[]) => cb(...args)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },

  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args)
}

contextBridge.exposeInMainWorld('electronAPI', api)
