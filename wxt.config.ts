import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join } from 'node:path'
import { defineConfig } from 'wxt'
import {
  TOOLS_ROUTE_BASE,
  TOOLS_SPA_ENTRY,
  getToolsSpaAliases,
} from './lib/tool-catalog'

const require = createRequire(import.meta.url)

function writeToolsRouteAliases(outDir: string) {
  const htmlPath = join(outDir, TOOLS_SPA_ENTRY)
  if (!existsSync(htmlPath)) {
    return []
  }

  const html = readFileSync(htmlPath, 'utf8')
  const aliases = getToolsSpaAliases().map((alias) => alias.path)

  for (const alias of aliases) {
    const aliasPath = join(outDir, alias)
    mkdirSync(dirname(aliasPath), { recursive: true })
    writeFileSync(aliasPath, html)
  }

  return aliases
}

function copyTesseractAssets(outDir: string) {
  const targetDir = join(outDir, 'libs/tesseract')
  mkdirSync(targetDir, { recursive: true })

  const assets = [
    require.resolve('tesseract.js/dist/worker.min.js'),
    require.resolve('tesseract.js-core/tesseract-core-lstm.wasm.js'),
    require.resolve('tesseract.js-core/tesseract-core-simd-lstm.wasm.js'),
    require.resolve(
      'tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js',
    ),
  ]

  for (const assetPath of assets) {
    copyFileSync(assetPath, join(targetDir, basename(assetPath)))
  }

  return assets.map((assetPath) => ({
    type: 'asset' as const,
    fileName: `libs/tesseract/${basename(assetPath)}`,
  }))
}

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  dev: {
    server: {
      port: 3001,
      origin: 'localhost',
    },
  },

  vite: () => ({
    server: {
      cors: true,
    },
  }),

  manifest: {
    name: 'QHelper前端助手',
    description: 'json解析',
    version: '1.2',
    permissions: [
      'cookies',
      'browsingData',
      'tabs',
      'storage',
      'activeTab',
      'sidePanel',
      'contextMenus',
      'bookmarks',
      'scripting',
      'downloads',
      'videoCapture',
      'alarms',
    ],
    host_permissions: ['<all_urls>'],
    icons: {
      16: '/icons/q-16.png',
      48: '/icons/q-48.png',
      128: '/icons/q-128.png',
    },
    web_accessible_resources: [
      {
        resources: ['icons/zread-favicon.ico'],
        matches: ['*://github.com/*'],
      },
    ],
    action: {
      default_popup: 'popup',
    },
  },

  hooks: {
    'build:done': (wxt, output) => {
      const aliases = writeToolsRouteAliases(wxt.config.outDir)
      output.publicAssets.push(
        ...aliases.map((fileName) => ({ type: 'asset' as const, fileName })),
        ...copyTesseractAssets(wxt.config.outDir),
      )
    },
    'prepare:publicPaths': (_, paths) => {
      paths.push({
        type: 'templateLiteral',
        path: `${TOOLS_ROUTE_BASE}/\${string}`,
      })
    },
  },
})
