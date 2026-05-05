import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { defineConfig } from 'wxt';

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
    permissions: ['cookies', 'tabs', 'storage', 'activeTab', 'sidePanel', 'contextMenus', 'bookmarks', 'scripting'],
    host_permissions: ['<all_urls>'],
    icons: {
      16: '/icons/q-16.png',
      48: '/icons/q-48.png',
      128: '/icons/q-128.png',
    },
    action: {
      default_popup: 'popup',
    },
  },

});
