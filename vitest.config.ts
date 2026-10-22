import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url))

const COMPONENT_TESTS = 'app/src/components/**/*.test.ts'

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
    globals: true,
    // Nested worktrees hold full repo copies
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**'],
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['**/*.test.ts'],
          exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**', COMPONENT_TESTS],
        },
      },
      './app/vitest.config.ts',
    ],
  },
})
