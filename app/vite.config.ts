import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import { contentSecurityPolicy, documentSecurityPolicies, securityHeaders } from './build/security'
import { spaFallbackDocument } from './build/staticHosting'
import { microlighterGrammars } from './build/syntaxHighlighting'

// Base path matches GitHub Pages repository sub-path across dev and build
const BASE_PATH = '/buzzsaw/'

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url))

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

  server: { port: 5173, headers: securityHeaders },
  preview: {
    port: 4173,
    headers: { ...securityHeaders, 'Content-Security-Policy': contentSecurityPolicy },
  },
})
