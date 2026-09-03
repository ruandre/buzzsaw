// Applies the beforePacking transform on disk, so `npm pack` here matches `pnpm pack` in CI
import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import { toPublishManifest } from '../publish-manifest.mjs'

const path = process.argv[2]
const manifest = toPublishManifest(JSON.parse(readFileSync(path, 'utf8')))
writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`)
