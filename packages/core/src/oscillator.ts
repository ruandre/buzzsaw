import type { SoundDefinition } from './types.js'
import type { BaseAudioContextLike, OscillatorNodeLike } from './webAudio.js'
import { DEFAULT_WAVE_TYPE, MAX_PARTIALS } from './constants.js'

/** Harmonic amplitudes for custom wave; null if invalid or unspecified */
export function resolvePartials(def: SoundDefinition): number[] | null {
  if (def.waveType !== 'custom' || !Array.isArray(def.partials)) {
    return null
  }

  const partials = def.partials
    .slice(0, MAX_PARTIALS)
    .filter(value => typeof value === 'number' && Number.isFinite(value))

  return partials.some(value => value !== 0) ? partials : null
}

/** Sets waveform, falling back to default shape if PeriodicWave fails */
export function applyWaveShape(
  audioContext: BaseAudioContextLike,
  oscillator: OscillatorNodeLike,
  def: SoundDefinition,
): void {
  const partials = resolvePartials(def)

  if (partials && typeof audioContext.createPeriodicWave === 'function') {
    try {
      oscillator.setPeriodicWave(audioContext.createPeriodicWave(
        new Float32Array(partials.length + 1),
        Float32Array.from([0, ...partials]),
      ))
      return
    }
    catch (e) {
      console.error('Failed to build a custom periodic wave; falling back to the default shape:', e)
    }
  }

  const waveType = def.waveType ?? DEFAULT_WAVE_TYPE
  oscillator.type = waveType === 'custom' ? DEFAULT_WAVE_TYPE : waveType
}

const TAU = 2 * Math.PI

// PeriodicWave normalizes by the peak of the series sampled at a power-of-two resolution
const NORMALIZATION_SAMPLES = 2048

/**
 * Normalized amplitude [-1, 1] at phase in radians, matching the Web Audio waveform: every
 * built-in shape is an odd function rising through zero at phase 0
 */
export function evaluateWaveShape(def: SoundDefinition, phase: number): number {
  const partials = resolvePartials(def)
  if (partials) {
    return evaluateSeries(partials, phase) / seriesPeak(partials)
  }

  const cycle = ((phase % TAU) + TAU) % TAU
  switch (def.waveType) {
    case 'square':
      return Math.sin(phase) >= 0 ? 1 : -1
    case 'sawtooth':
      return cycle <= Math.PI ? cycle / Math.PI : cycle / Math.PI - 2
    case 'triangle':
      return triangleAt(cycle / TAU)
    default:
      return Math.sin(phase)
  }
}

function triangleAt(progress: number): number {
  if (progress < 0.25) {
    return 4 * progress
  }
  if (progress < 0.75) {
    return 2 - 4 * progress
  }
  return 4 * progress - 4
}

function evaluateSeries(partials: number[], phase: number): number {
  let sum = 0
  for (let harmonic = 0; harmonic < partials.length; harmonic++) {
    sum += partials[harmonic] * Math.sin(phase * (harmonic + 1))
  }
  return sum
}

// Single-entry memo: callers sample one definition thousands of times in a row
let lastPeak: { key: string, peak: number } | null = null

function seriesPeak(partials: number[]): number {
  const key = partials.join()
  if (lastPeak?.key !== key) {
    let peak = 0
    for (let n = 0; n < NORMALIZATION_SAMPLES; n++) {
      peak = Math.max(peak, Math.abs(evaluateSeries(partials, (TAU * n) / NORMALIZATION_SAMPLES)))
    }
    lastPeak = { key, peak }
  }
  return lastPeak.peak
}
