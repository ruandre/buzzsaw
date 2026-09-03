export type WavBitDepth = 8 | 16 | 24 | 32

export interface WavEncodingOptions {
  /** Target sample rate in Hz. Defaults to 44100 */
  sampleRate?: number
  /** Channel count (1=mono, 2=stereo). Defaults to input channels */
  numChannels?: number
  /** Bit depth: 8, 16, 24 integer PCM or 32 IEEE float. Defaults to 16 */
  bitDepth?: WavBitDepth
}

export interface WavExportOptions extends WavEncodingOptions {
  /** Download filename. Defaults to 'sound.wav' */
  filename?: string
  /** Pitch multiplier (e.g. 2.0 = octave up) */
  pitchScale?: number
  /** Volume multiplier. Defaults to 1.0 */
  volume?: number
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
