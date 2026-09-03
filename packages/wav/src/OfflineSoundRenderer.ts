import type { AudioBufferLike, SoundDefinition } from '@rjvr/buzzsaw'
import type { OfflineAudioContextConstructor, WavExportOptions } from './types.js'
import { calculateEffectiveDuration, playSoundFromDefinition } from '@rjvr/buzzsaw'
import { requireChannelCount, requireSampleRate } from './options.js'

const UNSUPPORTED_MESSAGE = 'OfflineAudioContext is not available in this environment. '
  + 'In Node, install node-web-audio-api and pass its OfflineAudioContext as '
  + 'the offlineAudioContextClass option, or assign it to globalThis.'

interface OfflineAudioContextGlobals {
  OfflineAudioContext?: OfflineAudioContextConstructor
  webkitOfflineAudioContext?: OfflineAudioContextConstructor
}

/** Synthesizes SoundDefinition to an audio buffer without an output device */
export class OfflineSoundRenderer {
  /** True if a global OfflineAudioContext exists; an explicit class always works */
  static isSupported(): boolean {
    return this.getOfflineAudioContextClass() !== null
  }

  /** Global OfflineAudioContext constructor with webkit prefix fallback */
  static getOfflineAudioContextClass(): OfflineAudioContextConstructor | null {
    const scope = globalThis as OfflineAudioContextGlobals
    return scope.OfflineAudioContext ?? scope.webkitOfflineAudioContext ?? null
  }

  /**
   * Faster than real time, no user gesture; buffer spans `calculateEffectiveDuration` so the tail is included
   * @throws if no OfflineAudioContext is available, or `sampleRate` is below 8000
   */
  static async render(
    definition: SoundDefinition,
    options: WavExportOptions = {},
  ): Promise<AudioBufferLike> {
    const OfflineContextClass = options.offlineAudioContextClass
      ?? this.getOfflineAudioContextClass()
    if (!OfflineContextClass) {
      throw new Error(UNSUPPORTED_MESSAGE)
    }

    const sampleRate = requireSampleRate(options.sampleRate)
    const numChannels = requireChannelCount(options.numChannels)
    const length = Math.max(1, Math.ceil(calculateEffectiveDuration(definition) * sampleRate))

    const offlineCtx = new OfflineContextClass(numChannels, length, sampleRate)
    playSoundFromDefinition(offlineCtx, definition, {
      volume: options.volume,
      pitchScale: options.pitchScale,
    })

    return offlineCtx.startRendering()
  }
}
