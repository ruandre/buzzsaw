import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig, searchForWorkspaceRoot } from 'vite'
import { contentSecurityPolicy, documentSecurityPolicies, securityHeaders } from './build/security'
import { spaFallbackDocument } from './build/staticHosting'
import { microlighterGrammars } from './build/syntaxHighlighting'

// Base path matches GitHub Pages repository sub-path across dev and build
const BASE_PATH = '/buzzsaw/'

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url))

const require = createRequire(import.meta.url)
// aube stores packages outside the workspace, which Vite's dev server refuses to serve; assets the browser
// requests directly (font files, grammar modules) need the real directory of the package entry
// eslint-disable-next-line security/detect-non-literal-fs-filename -- resolved from a package name literal
const entryDirectory = (name: string) => dirname(realpathSync(require.resolve(name)))
const RUNTIME_ASSET_PACKAGES = ['@fontsource-variable/geist-mono', '@fontsource-variable/instrument-sans', 'microlighter']

export default defineConfig({
  base: BASE_PATH,
  resolve: {
    alias: {
      '@': resolve('./src'),
      // Aliases resolve directly to package source for hot-reloading
      '@rjvr/buzzsaw/sounds': resolve('../packages/core/src/sounds.ts'),
      '@rjvr/buzzsaw': resolve('../packages/core/src/index.ts'),
      '@rjvr/buzzsaw-wav': resolve('../packages/wav/src/index.ts'),
    },
  },
  plugins: [
    vue({
      template: {
        // Treat HTML5 <search> landmark element as custom element
        compilerOptions: { isCustomElement: tag => tag === 'search' },
      },
    }),
    UnoCSS(),
    documentSecurityPolicies(),
    spaFallbackDocument(),
    microlighterGrammars(),
  ],
  optimizeDeps: {
    // Excluded so runtime dynamic imports for grammars resolve to package directory
    exclude: ['microlighter'],
  },
  build: {
    // Disallow font inlining to satisfy strict CSP font-src directive
    assetsInlineLimit: (filePath: string) =>
      /\.(?:woff2?|ttf|otf|eot)$/i.test(filePath) ? false : undefined,
    // Native modulepreload supported; omits inline polyfill script for CSP
    modulePreload: { polyfill: false },
  },

  server: {
    port: 5173,
    headers: securityHeaders,
    fs: { allow: [searchForWorkspaceRoot(resolve('.')), ...RUNTIME_ASSET_PACKAGES.map(entryDirectory)] },
  },
  preview: {
    port: 4173,
    headers: { ...securityHeaders, 'Content-Security-Policy': contentSecurityPolicy },
  },
})
