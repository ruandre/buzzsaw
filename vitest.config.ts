import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      // Resolves workspace packages to source so tests never run against stale dist
      '@rjvr/buzzsaw/sounds': resolve('./packages/core/src/sounds.ts'),
      '@rjvr/buzzsaw': resolve('./packages/core/src/index.ts'),
      '@rjvr/buzzsaw-wav': resolve('./packages/wav/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
