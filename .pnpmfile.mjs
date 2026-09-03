import { toPublishManifest } from './scripts/publish-manifest.mjs'

export const hooks = {
  beforePacking: toPublishManifest,
}
