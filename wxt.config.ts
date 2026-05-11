import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { defineConfig } from 'wxt';
import {
  ORDINARY_TOOL_IDS,
  TOOL_SETTINGS_ID,
  TOOLS_ROUTE_BASE,
  TOOLS_SPA_ENTRY,
} from './lib/tools-spa';

const require = createRequire(import.meta.url);

function uglifyJsBrowserPlugin() {
  const virtualModuleId = 'virtual:uglify-js-browser';
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;

  return {
    name: 'qhelper-uglify-js-browser',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (id === 'uglify-js') {
        return resolvedVirtualModuleId;
      }
    },
    load(id: string) {
      if (id !== resolvedVirtualModuleId) {
        return null;
      }

      const sourceFiles = [
        'lib/utils.js',
        'lib/ast.js',
        'lib/transform.js',
        'lib/parse.js',
        'lib/scope.js',
        'lib/compress.js',
        'lib/output.js',
        'lib/sourcemap.js',
        'lib/mozilla-ast.js',
        'lib/propmangle.js',
        'lib/minify.js',
        'tools/exports.js',
      ];
      const uglifySource = sourceFiles
        .map((file) => readFileSync(require.resolve(`uglify-js/${file}`), 'utf8'))
        .join('\n\n');
      const domprops = readFileSync(require.resolve('uglify-js/tools/domprops.json'), 'utf8');

      return `
const exports = {};
const domprops = ${domprops};

${uglifySource}

const uglifyMinify = exports.minify;
const uglifyParse = exports.parse;
export { uglifyMinify as minify, uglifyParse as parse };
export default exports;
`;
    },
  };
}

function writeToolsRouteAliases(outDir: string) {
  const htmlPath = join(outDir, TOOLS_SPA_ENTRY);
  if (!existsSync(htmlPath)) {
    return [];
  }

  const html = readFileSync(htmlPath, 'utf8');
  const aliases = [...ORDINARY_TOOL_IDS, TOOL_SETTINGS_ID].map(
    (toolId) => `${TOOLS_ROUTE_BASE}/${toolId}.html`,
  );

  for (const alias of aliases) {
    const aliasPath = join(outDir, alias);
    mkdirSync(dirname(aliasPath), { recursive: true });
    writeFileSync(aliasPath, html);
  }

  return aliases;
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
    plugins: [uglifyJsBrowserPlugin()],
    server: {
      cors: true,
    },
    optimizeDeps: {
      exclude: ['uglify-js'],
    },
  }),

  manifest: {
    name: 'QHelper前端助手',
    description: 'json解析',
    version: '1.2',
    permissions: ['cookies', 'tabs', 'storage', 'activeTab', 'sidePanel', 'contextMenus', 'bookmarks', 'scripting', 'downloads'],
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
      const aliases = writeToolsRouteAliases(wxt.config.outDir);
      output.publicAssets.push(
        ...aliases.map((fileName) => ({ type: 'asset' as const, fileName })),
      );
    },
    'prepare:publicPaths': (_, paths) => {
      paths.push({
        type: 'templateLiteral',
        path: `${TOOLS_ROUTE_BASE}/\${string}`,
      });
    },
  },

});
