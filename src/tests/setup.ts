import '@testing-library/jest-dom'

if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...(globalThis.crypto || {}),
      randomUUID: () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    },
    writable: true
  })
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
})

Object.defineProperty(window, 'electronAPI', {
  writable: true,
  value: {
    project: {
      create: async () => null,
      open: async () => null,
      save: async () => null,
      saveAs: async () => null,
      list: async () => [],
      delete: async () => true,
      duplicate: async () => null,
      export: async () => null,
      import: async () => null
    },
    image: {
      selectBase: async () => null,
      uploadAssets: async () => [],
      removeBackground: async () => '',
      getThumbnail: async () => '',
      getMetadata: async () => null
    },
    generation: {
      start: async () => {},
      pause: async () => {},
      resume: async () => {},
      stop: async () => {},
      status: async () => ({ status: 'idle', current: 0, total: 0 }),
      preview: async () => null
    },
    rarity: {
      calculate: async () => null,
      normalize: async () => null
    },
    metadata: {
      export: async () => null
    },
    report: {
      generate: async () => null
    },
    dialog: {
      openFile: async () => null,
      saveFile: async () => null,
      selectDirectory: async () => null
    },
    app: {
      getPath: async () => '',
      getVersion: async () => '1.0.0',
      getPlatform: async () => 'win32',
      isDev: async () => true
    },
    shell: {
      openExternal: async () => {}
    },
    fs: {
      readFile: async () => null,
      writeFile: async () => {},
      readDir: async () => [],
      makeDir: async () => {},
      exists: async () => false,
      deleteFile: async () => {},
      deleteDir: async () => {},
      copyFile: async () => {},
      rename: async () => {},
      stat: async () => ({})
    },
    update: {
      check: async () => null,
      download: async () => {},
      install: async () => {},
      onChecking: () => () => {},
      onAvailable: () => () => {},
      onNotAvailable: () => () => {},
      onProgress: () => () => {},
      onDownloaded: () => () => {}
    },
    on: () => () => {},
    send: () => {}
  }
})
