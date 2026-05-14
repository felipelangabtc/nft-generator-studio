export interface ElectronAPI {
  project: {
    create(data: any): Promise<any>
    open(id: string): Promise<any>
    save(project: any): Promise<any>
    saveAs(project: any): Promise<any>
    list(): Promise<any[]>
    delete(id: string): Promise<boolean>
    duplicate(id: string): Promise<any>
    export(id: string): Promise<string | null>
    import(): Promise<any>
  }
  image: {
    selectBase(): Promise<any>
    uploadAssets(categoryId: string): Promise<any[]>
    removeBackground(imagePath: string): Promise<string>
    getThumbnail(imagePath: string, size?: number): Promise<string>
    getMetadata(imagePath: string): Promise<any>
  }
  generation: {
    start(config: any): Promise<void>
    pause(): Promise<void>
    resume(): Promise<void>
    stop(): Promise<void>
    status(): Promise<any>
    preview(seed?: string): Promise<any>
  }
  rarity: {
    calculate(): Promise<any>
    normalize(): Promise<any>
  }
  metadata: {
    export(config: any): Promise<string | null>
  }
  report: {
    generate(format: string): Promise<string | null>
  }
  dialog: {
    openFile(options?: any): Promise<any>
    saveFile(options?: any): Promise<any>
    selectDirectory(options?: any): Promise<any>
  }
  app: {
    getPath(name: string): Promise<string>
    getVersion(): Promise<string>
    getPlatform(): Promise<string>
    isDev(): Promise<boolean>
  }
  shell: {
    openExternal(url: string): Promise<void>
  }
  fs: {
    readFile(filePath: string, encoding?: string): Promise<any>
    writeFile(filePath: string, data: any): Promise<void>
    readDir(dirPath: string): Promise<any[]>
    makeDir(dirPath: string): Promise<void>
    exists(filePath: string): Promise<boolean>
    deleteFile(filePath: string): Promise<void>
    deleteDir(dirPath: string): Promise<void>
    copyFile(src: string, dest: string): Promise<void>
    rename(oldPath: string, newPath: string): Promise<void>
    stat(filePath: string): Promise<any>
  }
  update: {
    check(): Promise<any>
    download(): Promise<void>
    install(): Promise<void>
    onChecking(cb: () => void): () => void
    onAvailable(cb: (info: any) => void): () => void
    onNotAvailable(cb: (info: any) => void): () => void
    onProgress(cb: (progress: any) => void): () => void
    onDownloaded(cb: (info: any) => void): () => void
  }
  on(channel: string, cb: (...args: any[]) => void): () => void
  send(channel: string, ...args: any[]): void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
