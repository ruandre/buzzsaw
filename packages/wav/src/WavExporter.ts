import type { AudioBufferLike, SoundDefinition } from '@rjvr/buzzsaw'
import type { WavExportOptions } from './types'
import { OfflineSoundRenderer } from './OfflineSoundRenderer'
import { WavEncoder } from './WavEncoder'

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
  ): Promise<Blob> {
    return WavEncoder.encodeToBlob(await this.renderToAudioBuffer(definition, options), options)
  }

  /** Renders SoundDefinition or saves Blob as a WAV download; throws without a DOM document */
  static async downloadWav(
    soundOrBlob: SoundDefinition | Blob,
    optionsOrFilename?: string | WavExportOptions,
  ): Promise<void> {
    const options: WavExportOptions = typeof optionsOrFilename === 'string'
      ? { filename: optionsOrFilename }
      : optionsOrFilename ?? {}

    const blob = soundOrBlob instanceof Blob
      ? soundOrBlob
      : await this.renderToWavBlob(soundOrBlob, options)

    saveBlob(blob, toWavFilename(options.filename))
  }
}

function toWavFilename(filename?: string): string {
  const base = (filename || DEFAULT_FILENAME).trim().replace(/[/\\?%*:|"<>]/g, '_')
  return base.endsWith('.wav') ? base : `${base}.wav`
}

function saveBlob(blob: Blob, filename: string): void {
  const doc = resolveDocument()
  if (!doc?.createElement || !doc.body) {
    throw new Error(
      'downloadWav requires a DOM document. Outside the browser, use renderToWavArrayBuffer '
      + 'or renderToWavBlob and write the result yourself.',
    )
  }

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

function resolveDocument(): Document | undefined {
  if (typeof document !== 'undefined') {
    return document
  }
  return (globalThis as { document?: Document }).document
}
