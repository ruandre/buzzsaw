import type { EnvelopeDefinition, SoundDefinition } from './types'
import {
  DEFAULT_ATTACK_S,
  DEFAULT_DECAY_S,
  DEFAULT_DURATION_S,
  DEFAULT_ENVELOPE_GAIN,
  DEFAULT_FREQUENCY_HZ,
  DEFAULT_FREQUENCY_INTERPOLATION,
  DEFAULT_GAIN,
  DEFAULT_GAIN_INTERPOLATION,
  ENVELOPE_TAIL_PAD_S,
  MIN_DECAY_WINDOW_S,
  MIN_DURATION_S,
  MIN_FREQUENCY_HZ,
} from './constants'
import { cloneEnvelope, isEnvelope, latestStepTime, sampleEnvelopeValue } from './envelope'
import { clamp, finiteOr } from './numeric'
import { validateSoundDefinition } from './validation'

/** Deep copies SoundDefinition; throws TypeError if not an object */
export function cloneSoundDefinition(def: SoundDefinition): SoundDefinition {
  if (!def || typeof def !== 'object') {
    throw new TypeError('Sound definition must be a non-null object.')
  }

  return {
    waveType: def.waveType,
    partials: def.partials ? [...def.partials] : undefined,
    duration: def.duration,
    attack: def.attack,
    decay: def.decay,
    frequency: isEnvelope(def.frequency) ? cloneEnvelope(def.frequency) : def.frequency,
    gain: isEnvelope(def.gain) ? cloneEnvelope(def.gain) : def.gain,
  }
}

/** Recursively freezes a definition and its envelopes, making `Readonly` hold at runtime */
export function freezeSoundDefinition(def: SoundDefinition): Readonly<SoundDefinition> {
  if (isEnvelope(def.frequency)) {
    freezeEnvelope(def.frequency)
  }
  if (isEnvelope(def.gain)) {
    freezeEnvelope(def.gain)
  }
  if (def.partials) {
    Object.freeze(def.partials)
  }
  return Object.freeze(def)
}

/** Seconds; `duration` unless envelope steps run past it, then last step plus a short tail wins */
export function calculateEffectiveDuration(def: SoundDefinition): number {
  if (!def || typeof def !== 'object') {
    return DEFAULT_DURATION_S
  }

  const lastStepTime = Math.max(
    isEnvelope(def.frequency) ? latestStepTime(def.frequency) : 0,
    isEnvelope(def.gain) ? latestStepTime(def.gain) : 0,
  )
  const nominalDuration = finiteOr(def.duration, DEFAULT_DURATION_S)

  return Math.max(
    MIN_DURATION_S,
    nominalDuration,
    lastStepTime > 0 ? lastStepTime + ENVELOPE_TAIL_PAD_S : 0,
  )
}

/** Samples frequency in Hz at time offset; falls back to default pitch on error */
export function sampleFrequencyAtTime(def: SoundDefinition, time: number): number {
  if (!def || typeof def !== 'object') {
    return DEFAULT_FREQUENCY_HZ
  }

  const { frequency } = def

  if (typeof frequency === 'number') {
    return Math.max(MIN_FREQUENCY_HZ, finiteOr(frequency, DEFAULT_FREQUENCY_HZ))
  }
  if (isEnvelope(frequency)) {
    return Math.max(
      MIN_FREQUENCY_HZ,
      sampleEnvelopeValue(withFrequencyFallback(frequency), time, DEFAULT_FREQUENCY_INTERPOLATION),
    )
  }
  return DEFAULT_FREQUENCY_HZ
}

/** Samples gain [0..1] at time offset. Optional totalDuration avoids recomputing */
export function sampleGainAtTime(def: SoundDefinition, time: number, totalDuration?: number): number {
  if (!def || typeof def !== 'object') {
    return DEFAULT_GAIN
  }

  const duration = totalDuration ?? calculateEffectiveDuration(def)
  if (time < 0 || time > duration) {
    return 0
  }

  const { attack, decayStartTime } = resolveEnvelopeTiming(def, duration)
  const gain = def.gain ?? DEFAULT_GAIN

  if (typeof gain === 'number') {
    const peak = Math.max(0, finiteOr(gain, DEFAULT_GAIN))
    if (time < attack) {
      return (time / Math.max(0.0001, attack)) * peak
    }
    if (time < decayStartTime) {
      return peak
    }
    return Math.max(0, peak * (1 - decayProgress(time, decayStartTime, duration)))
  }

  if (isEnvelope(gain)) {
    const lastStepTime = latestStepTime(gain)
    const level = Math.max(
      0,
      sampleEnvelopeValue(withGainFallback(gain), time, DEFAULT_GAIN_INTERPOLATION),
    )
    // Decay tail applies only after authored envelope steps complete
    if (lastStepTime > 0 && time > lastStepTime && time >= decayStartTime) {
      return Math.max(0, level * (1 - decayProgress(time, decayStartTime, duration)))
    }
    return level
  }

  return DEFAULT_GAIN
}

export function isValidSoundDefinition(def: unknown): def is SoundDefinition {
  return validateSoundDefinition(def).length === 0
}

/** Attack and decay are carved out of `duration`; neither extends it */
export function resolveEnvelopeTiming(def: SoundDefinition, duration: number): {
  attack: number
  decay: number
  decayStartTime: number
} {
  const attack = clamp(finiteOr(def.attack, DEFAULT_ATTACK_S), 0, duration)
  const decay = clamp(
    finiteOr(def.decay, DEFAULT_DECAY_S),
    0,
    Math.max(MIN_DECAY_WINDOW_S, duration - attack),
  )
  return { attack, decay, decayStartTime: Math.max(attack, duration - decay) }
}

function freezeEnvelope(envelope: EnvelopeDefinition): void {
  if (Array.isArray(envelope.steps)) {
    envelope.steps.forEach(step => Object.freeze(step))
    Object.freeze(envelope.steps)
  }
  Object.freeze(envelope)
}

function decayProgress(time: number, decayStartTime: number, duration: number): number {
  return (time - decayStartTime) / Math.max(MIN_DECAY_WINDOW_S, duration - decayStartTime)
}

function withFrequencyFallback(envelope: EnvelopeDefinition): EnvelopeDefinition {
  return { ...envelope, start: finiteOr(envelope.start, DEFAULT_FREQUENCY_HZ) }
}

function withGainFallback(envelope: EnvelopeDefinition): EnvelopeDefinition {
  return { ...envelope, start: finiteOr(envelope.start, DEFAULT_ENVELOPE_GAIN) }
}
