import type { Plugin } from 'vite'
import { copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/** Copies index.html to 404.html for client-side routing on static hosts */
export function spaFallbackDocument(): Plugin {
  let outDir = 'dist'

  return {
    name: 'buzzsaw:spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      await copyFile(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}
