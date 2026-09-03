import type { SoundDefinition } from '@rjvr/buzzsaw'
import type { WavExportOptions } from './types'
import { calculateEffectiveDuration, playSoundFromDefinition } from '@rjvr/buzzsaw'

const MIN_SAMPLE_RATE = 8000
const DEFAULT_SAMPLE_RATE = 44100

interface OfflineAudioContextGlobals {
  OfflineAudioContext?: typeof OfflineAudioContext
  webkitOfflineAudioContext?: typeof OfflineAudioContext
}

/** Synthesizes SoundDefinition to AudioBuffer */
export class OfflineSoundRenderer {
  static isSupported(): boolean {
    return this.getOfflineAudioContextClass() !== null
  }

  /** OfflineAudioContext constructor with webkit prefix fallback */
  static getOfflineAudioContextClass(): typeof OfflineAudioContext | null {
    const scope = globalThis as OfflineAudioContextGlobals
    return scope.OfflineAudioContext ?? scope.webkitOfflineAudioContext ?? null
  }

  /** Renders audio offline; buffer includes release tail, throws if unsupported */
  static async render(
    definition: SoundDefinition,
    options: WavExportOptions = {},
  ): Promise<AudioBuffer> {
    const OfflineContextClass = this.getOfflineAudioContextClass()
    if (!OfflineContextClass) {
      throw new Error('OfflineAudioContext is not supported in this environment.')
    }

    const sampleRate = Math.max(MIN_SAMPLE_RATE, options.sampleRate ?? DEFAULT_SAMPLE_RATE)
    const numChannels = Math.max(1, options.numChannels ?? 1)
    const length = Math.max(1, Math.ceil(calculateEffectiveDuration(definition) * sampleRate))

    const offlineCtx = new OfflineContextClass(numChannels, length, sampleRate)
    playSoundFromDefinition(offlineCtx, definition, {
      volume: options.volume,
      pitchScale: options.pitchScale,
    })

    return offlineCtx.startRendering()
  }
}
