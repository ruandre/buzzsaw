import type { AudioBufferLike, SoundDefinition } from '@rjvr/buzzsaw'
import type { BlobLike, WavExportOptions } from './types.js'
import { OfflineSoundRenderer } from './OfflineSoundRenderer.js'
import { WavEncoder } from './WavEncoder.js'

const DEFAULT_FILENAME = 'sound'
const REVOKE_DELAY_MS = 200

export class WavExporter {
  static async renderToAudioBuffer(
    definition: SoundDefinition,
    options: WavExportOptions = {},
  ): Promise<AudioBufferLike> {
    return OfflineSoundRenderer.render(definition, options)
  }

  static async renderToWavArrayBuffer(
    definition: SoundDefinition,
    options: WavExportOptions = {},
  ): Promise<ArrayBuffer> {
    return WavEncoder.encode(await this.renderToAudioBuffer(definition, options), options)
  }

  static async renderToWavBlob(
    definition: SoundDefinition,
    options: WavExportOptions = {},
  ): Promise<BlobLike> {
    return WavEncoder.encodeToBlob(await this.renderToAudioBuffer(definition, options), options)
  }

  /** Renders SoundDefinition or saves Blob as a WAV download; throws without a DOM document */
  static async downloadWav(
    soundOrBlob: SoundDefinition | BlobLike,
    optionsOrFilename?: string | WavExportOptions,
  ): Promise<void> {
    // Checked before rendering so a Node caller hears about the missing document, not the missing OfflineAudioContext
    const doc = requireDocument()
    const options: WavExportOptions = typeof optionsOrFilename === 'string'
      ? { filename: optionsOrFilename }
      : optionsOrFilename ?? {}

    const blob = isBlob(soundOrBlob)
      ? soundOrBlob
      : await this.renderToWavBlob(soundOrBlob, options)

    saveBlob(doc, blob, toWavFilename(options.filename))
  }
}

function toWavFilename(filename?: string): string {
  const base = (filename || DEFAULT_FILENAME).trim().replace(/[/\\?%*:|"<>]/g, '_')
  return base.endsWith('.wav') ? base : `${base}.wav`
}

function saveBlob(doc: Document, blob: BlobLike, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = doc.createElement('a')
  anchor.style.display = 'none'
  anchor.href = url
  anchor.download = filename

  doc.body.appendChild(anchor)
  anchor.click()

  // Delayed revoke prevents Safari aborting download
  setTimeout(() => {
    anchor.remove()
    URL.revokeObjectURL(url)
  }, REVOKE_DELAY_MS)
}

function isBlob(value: SoundDefinition | BlobLike): value is BlobLike {
  return typeof Blob !== 'undefined' && value instanceof Blob
}

function requireDocument(): Document {
  const doc = typeof document !== 'undefined' ? document : (globalThis as { document?: Document }).document
  if (!doc?.createElement || !doc.body) {
    throw new Error(
      'downloadWav requires a DOM document. Outside the browser, use renderToWavArrayBuffer '
      + 'or renderToWavBlob and write the result yourself.',
    )
  }
  return doc
}
