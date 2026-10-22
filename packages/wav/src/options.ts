import type { WavBitDepth } from './types.js'
import { MIN_SAMPLE_RATE } from './types.js'

export const DEFAULT_SAMPLE_RATE = 44100
export const DEFAULT_BIT_DEPTH: WavBitDepth = 16
export const SUPPORTED_BIT_DEPTHS: readonly WavBitDepth[] = [8, 16, 24, 32]
export const MAX_UINT16 = 0xFFFF
export const MAX_UINT32 = 0xFFFFFFFF

export function requireSampleRate(sampleRate: number | undefined): number {
  if (sampleRate === undefined) {
    return DEFAULT_SAMPLE_RATE
  }
  if (!Number.isInteger(sampleRate) || sampleRate < MIN_SAMPLE_RATE || sampleRate > MAX_UINT32) {
    throw new RangeError(
      `Invalid sampleRate: ${sampleRate}. Must be an integer from ${MIN_SAMPLE_RATE} to ${MAX_UINT32}.`,
    )
  }
  return sampleRate
}

/** No 8000 Hz floor: browsers make valid buffers from 3000 Hz, and at fractional rates */
export function requireHeaderSampleRate(sampleRate: number): number {
  const rounded = Math.round(sampleRate)
  if (!Number.isFinite(sampleRate) || rounded < 1) {
    throw new RangeError(
      `Invalid audio buffer sampleRate: ${sampleRate}. Must be a finite number of at least 1 Hz after rounding.`,
    )
  }
  return rounded
}

export function requireChannelCount(numChannels: number | undefined, fallback = 1): number {
  if (numChannels === undefined) {
    return fallback
  }
  if (!Number.isInteger(numChannels) || numChannels < 1 || numChannels > MAX_UINT16) {
    throw new RangeError(`Invalid numChannels: ${numChannels}. Must be an integer from 1 to ${MAX_UINT16}.`)
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
