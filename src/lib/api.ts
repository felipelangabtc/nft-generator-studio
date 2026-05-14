const api = typeof window !== 'undefined' ? window.electronAPI : null

function ensureApi() {
  if (!api) throw new Error('Electron API not available')
  return api
}

export const ProjectAPI = {
  create: (data: any) => ensureApi().project.create(data),
  open: (id: string) => ensureApi().project.open(id),
  save: (project: any) => ensureApi().project.save(project),
  saveAs: (project: any) => ensureApi().project.saveAs(project),
  list: () => ensureApi().project.list(),
  delete: (id: string) => ensureApi().project.delete(id),
  duplicate: (id: string) => ensureApi().project.duplicate(id),
  export: (id: string) => ensureApi().project.export(id),
  import: () => ensureApi().project.import()
}

export const ImageAPI = {
  selectBase: () => ensureApi().image.selectBase(),
  uploadAssets: (categoryId: string) => ensureApi().image.uploadAssets(categoryId),
  removeBackground: (imagePath: string) => ensureApi().image.removeBackground(imagePath),
  getThumbnail: (imagePath: string, size?: number) => ensureApi().image.getThumbnail(imagePath, size),
  getMetadata: (imagePath: string) => ensureApi().image.getMetadata(imagePath)
}

export const GenerationAPI = {
  start: (config: any) => ensureApi().generation.start(config),
  pause: () => ensureApi().generation.pause(),
  resume: () => ensureApi().generation.resume(),
  stop: () => ensureApi().generation.stop(),
  status: () => ensureApi().generation.status(),
  preview: (seed?: string) => ensureApi().generation.preview(seed)
}

export const RarityAPI = {
  calculate: () => ensureApi().rarity.calculate(),
  normalize: () => ensureApi().rarity.normalize()
}

export const MetadataAPI = {
  export: (config: any) => ensureApi().metadata.export(config)
}

export const ReportAPI = {
  generate: (format: string) => ensureApi().report.generate(format)
}

export const DialogAPI = {
  openFile: (options?: any) => ensureApi().dialog.openFile(options),
  saveFile: (options?: any) => ensureApi().dialog.saveFile(options),
  selectDirectory: (options?: any) => ensureApi().dialog.selectDirectory(options)
}

export const AppAPI = {
  getPath: (name: string) => ensureApi().app.getPath(name),
  getVersion: () => ensureApi().app.getVersion(),
  getPlatform: () => ensureApi().app.getPlatform(),
  isDev: () => ensureApi().app.isDev()
}

export const ShellAPI = {
  openExternal: (url: string) => ensureApi().shell.openExternal(url)
}

export const FSAPI = {
  readFile: (filePath: string, encoding?: string) => ensureApi().fs.readFile(filePath, encoding),
  writeFile: (filePath: string, data: any) => ensureApi().fs.writeFile(filePath, data),
  readDir: (dirPath: string) => ensureApi().fs.readDir(dirPath),
  makeDir: (dirPath: string) => ensureApi().fs.makeDir(dirPath),
  exists: (filePath: string) => ensureApi().fs.exists(filePath),
  deleteFile: (filePath: string) => ensureApi().fs.deleteFile(filePath),
  deleteDir: (dirPath: string) => ensureApi().fs.deleteDir(dirPath),
  copyFile: (src: string, dest: string) => ensureApi().fs.copyFile(src, dest),
  rename: (oldPath: string, newPath: string) => ensureApi().fs.rename(oldPath, newPath),
  stat: (filePath: string) => ensureApi().fs.stat(filePath)
}

export const UpdateAPI = {
  check: () => ensureApi().update.check(),
  download: () => ensureApi().update.download(),
  install: () => ensureApi().update.install(),
  onChecking: (cb: () => void) => ensureApi().update.onChecking(cb),
  onAvailable: (cb: (info: any) => void) => ensureApi().update.onAvailable(cb),
  onNotAvailable: (cb: (info: any) => void) => ensureApi().update.onNotAvailable(cb),
  onProgress: (cb: (progress: any) => void) => ensureApi().update.onProgress(cb),
  onDownloaded: (cb: (info: any) => void) => ensureApi().update.onDownloaded(cb)
}
