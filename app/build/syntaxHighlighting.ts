import type { Plugin } from 'vite'
import { cp, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

/** Copies MicroLighter TextMate grammars to assets for runtime dynamic imports */
export function microlighterGrammars(): Plugin {
  let destination = ''

  return {
    name: 'buzzsaw:microlighter-grammars',
    apply: 'build',
    configResolved(config) {
      destination = resolve(config.root, config.build.outDir, config.build.assetsDir, 'grammars')
    },
    async closeBundle() {
      const source = resolve(dirname(resolveMicrolighterEntry()), 'grammars')

      // Fails build loudly if package layout changes to prevent silent highlight loss
      const stats = await stat(source).catch(() => null)
      if (!stats?.isDirectory()) {
        throw new Error(
          `MicroLighter grammars not found at ${source}. Syntax highlighting would `
          + 'silently render as plain text; check whether the package layout changed.',
        )
      }

      await cp(source, destination, { recursive: true })
    },
  }
}

function resolveMicrolighterEntry(): string {
  return createRequire(import.meta.url).resolve('microlighter')
}
