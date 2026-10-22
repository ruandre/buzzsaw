import { defineProject, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Component tests run against the app's own Vite config (Vue SFCs, aliases) in a DOM
export default mergeConfig(viteConfig, defineProject({
  test: {
    name: 'components',
    environment: 'happy-dom',
    globals: true,
    include: ['src/components/**/*.test.ts'],
  },
}))
