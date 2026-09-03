import type { OfflineAudioContextLike } from '@rjvr/buzzsaw'

export type WavBitDepth = 8 | 16 | 24 | 32

/** Lowest sample rate the encoder and offline renderer accept */
export const MIN_SAMPLE_RATE = 8000

export type OfflineAudioContextConstructor = new (
  numberOfChannels: number,
  length: number,
  sampleRate: number
) => OfflineAudioContextLike

export interface WavEncodingOptions {
  /** Target sample rate in Hz, at least 8000. Defaults to 44100 */
  sampleRate?: number
  /**
   * Channel count in the encoded file. Defaults to the input's channel count.
   * Buzzsaw synthesis is mono, so 2 writes the same samples to both channels.
   */
  numChannels?: number
  /** Bit depth: 8, 16, 24 integer PCM or 32 IEEE float. Defaults to 16 */
  bitDepth?: WavBitDepth
}

export interface WavExportOptions extends WavEncodingOptions {
  /** Download filename. Defaults to 'sound.wav' */
  filename?: string
  /** Pitch multiplier, positive (e.g. 2.0 = octave up). Defaults to 1.0 */
  pitchScale?: number
  /** Volume multiplier, non-negative. Defaults to 1.0 */
  volume?: number
  /**
   * OfflineAudioContext implementation to render with. Defaults to the global one.
   * Node has no global; pass a polyfill such as `node-web-audio-api`'s.
   */
  offlineAudioContextClass?: OfflineAudioContextConstructor
}

export interface WavHeaderInfo {
  audioFormat: number
  numChannels: number
  sampleRate: number
  byteRate: number
  blockAlign: number
  bitDepth: number
  dataSize: number
  duration: number
}
