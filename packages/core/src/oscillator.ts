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

/** Normalized amplitude [-1, 1] at phase in radians */
export function evaluateWaveShape(def: SoundDefinition, phase: number): number {
  const partials = resolvePartials(def)
  if (partials) {
    return evaluatePartials(partials, phase)
  }

  const cycle = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  switch (def.waveType) {
    case 'square':
      return Math.sin(phase) >= 0 ? 1 : -1
    case 'sawtooth':
      return cycle / Math.PI - 1
    case 'triangle': {
      const progress = cycle / (2 * Math.PI)
      return progress < 0.5 ? 4 * progress - 1 : 3 - 4 * progress
    }
    default:
      return Math.sin(phase)
  }
}

// Evaluates harmonic series normalized to unit peak, matching PeriodicWave
function evaluatePartials(partials: number[], phase: number): number {
  let sum = 0
  let magnitude = 0

  for (let harmonic = 0; harmonic < partials.length; harmonic++) {
    sum += partials[harmonic] * Math.sin(phase * (harmonic + 1))
    magnitude += Math.abs(partials[harmonic])
  }

  return magnitude > 0 ? sum / magnitude : 0
}
