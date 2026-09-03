import type { WavBitDepth } from './types.js'
import { MIN_SAMPLE_RATE } from './types.js'

export const DEFAULT_SAMPLE_RATE = 44100
export const DEFAULT_BIT_DEPTH: WavBitDepth = 16
export const SUPPORTED_BIT_DEPTHS: readonly WavBitDepth[] = [8, 16, 24, 32]

export function requireSampleRate(sampleRate: number | undefined): number {
  if (sampleRate === undefined) {
    return DEFAULT_SAMPLE_RATE
  }
  if (!Number.isFinite(sampleRate) || sampleRate < MIN_SAMPLE_RATE) {
    throw new RangeError(
      `Invalid sampleRate: ${sampleRate}. Must be a finite number of at least ${MIN_SAMPLE_RATE}.`,
    )
  }
  return sampleRate
}

export function requireChannelCount(numChannels: number | undefined, fallback = 1): number {
  if (numChannels === undefined) {
    return fallback
  }
  if (!Number.isInteger(numChannels) || numChannels < 1) {
    throw new RangeError(`Invalid numChannels: ${numChannels}. Must be an integer of at least 1.`)
  }
  return numChannels
}

export function requireBitDepth(bitDepth: WavBitDepth | undefined): WavBitDepth {
  if (bitDepth === undefined) {
    return DEFAULT_BIT_DEPTH
  }
  if (!SUPPORTED_BIT_DEPTHS.includes(bitDepth)) {
    throw new RangeError(
      `Unsupported bit depth: ${bitDepth}. Supported depths are ${SUPPORTED_BIT_DEPTHS.join(', ')}.`,
    )
  }
  return bitDepth
}
