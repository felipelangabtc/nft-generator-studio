# NFT Generator Studio

Professional desktop application for generating PFP NFT collections using a layered image composition system with rarity configuration.

## Features

- **Project Management** — Create, save, open, duplicate, import/export projects
- **Layer Categories** — Unlimited categories with z-index ordering and drag-and-drop
- **Asset Management** — Upload PNG assets with automatic thumbnail generation
- **Rarity Configuration** — Per-asset weight, tiers (common→legendary), normalization
- **Compatibility Rules** — Exclusion, requirement, and mutual exclusion constraints
- **Real-time Preview** — Canvas with zoom, pan, and random generation preview
- **NFT Generation** — Multi-threaded engine with seeded randomness and duplicate detection
- **Metadata Export** — OpenSea, Magic Eden, ERC-721, ERC-1155 compatible JSON
- **Reports** — CSV, Excel, JSON, PDF rarity and generation reports
- **Export** — PNG, WebP, AVIF output formats
- **Auto-save & Backup** — Automatic project saving and version history

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 30 |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| State | Zustand, TanStack Query |
| Backend | Node.js, Express IPC |
| Image | Sharp, libvips |
| Database | SQLite, Prisma |
| Validation | Zod |
| Logging | Pino |
| Testing | Vitest, Playwright |
| Docs | TypeDoc |
| Packaging | electron-builder |

## Quick Start

```bash
# Install dependencies
npm install

# Initialize database
npx prisma generate

# Start development
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Project Structure

```
nft-generator/
├── electron/           # Electron main process
│   ├── main.ts         # App entry, window, IPC handlers
│   ├── preload.ts      # Context bridge API
│   └── services/       # Business logic
│       ├── projectService.ts
│       ├── imageService.ts
│       ├── generationService.ts
│       ├── rarityService.ts
│       └── metadataService.ts
├── src/                # React renderer
│   ├── main.tsx        # React entry
│   ├── App.tsx         # Router & providers
│   ├── components/     # UI components
│   │   ├── ui/         # shadcn-style primitives
│   │   ├── layout/     # App shell
│   │   └── editor/     # Editor panels
│   ├── pages/          # Route pages
│   ├── stores/         # Zustand stores
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities & API
│   └── types/          # TypeScript types
├── prisma/             # Database schema
└── resources/          # App icons & assets
```

## Configuration

### Generation Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `totalCount` | 100 | Number of NFTs to generate |
| `seed` | — | Optional seed for reproducible generation |
| `maxRetries` | 100 | Max attempts to find unique combinations |
| `parallelThreads` | 4 | Concurrent generation threads |
| `enableDeduplication` | true | Perceptual hash duplicate detection |
| `outputFormat` | png | Image output format (png/webp/avif) |
| `quality` | 100 | Output image quality |

### Metadata Formats

- **OpenSea** — Full attribute metadata with collection properties
- **Magic Eden** — Solana-compatible metadata with seller fees
- **ERC-721** — Standard Ethereum NFT metadata
- **ERC-1155** — Multi-token standard metadata

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New project |
| `Ctrl+O` | Open project |
| `Ctrl+S` | Save project |
| `Ctrl+G` | Start generation |
| `Ctrl+P` | Random preview |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+\`` | Toggle console |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |

## Building

```bash
# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

## API

The application exposes a local REST API (optional) and a full Electron IPC API. See [API documentation](docs/api.md) for details.

## License

MIT
