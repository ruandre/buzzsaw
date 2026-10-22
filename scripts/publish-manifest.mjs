// Safe to drop: consumers never install devDependencies, and npm runs none of these scripts
const DEVELOPMENT_ONLY_FIELDS = ['scripts', 'devDependencies']

/**
 * Mutates `manifest` in place and returns it
 * @param {Record<string, unknown>} manifest
 * @returns {Record<string, unknown>} the same object
 */
export function toPublishManifest(manifest) {
  for (const field of DEVELOPMENT_ONLY_FIELDS) {
    delete manifest[field]
  }
  return manifest
}
