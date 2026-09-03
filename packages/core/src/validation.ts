import type { WaveType } from './types.js'
import { MAX_FREQUENCY_HZ, MAX_GAIN, MAX_PARTIALS, MIN_DURATION_S, WAVE_TYPES } from './constants.js'

const INTERPOLATIONS = ['linear', 'step']

const KNOWN_KEYS = ['waveType', 'partials', 'frequency', 'gain', 'duration', 'attack', 'decay']
const KNOWN_ENVELOPE_KEYS = ['start', 'steps', 'interpolation']

/** Returns validation errors, or empty array if valid */
export function validateSoundDefinition(def: unknown): string[] {
  if (!def || typeof def !== 'object' || Array.isArray(def)) {
    return ['Sound definition must be a non-null object.']
  }

  const candidate = def as Record<string, unknown>

  return [
    ...validateKeys(candidate),
    ...validateWaveType(candidate.waveType),
    ...validatePartials(candidate),
    ...validateFrequency(candidate.frequency),
    ...validateGain(candidate.gain),
    ...validateTiming(candidate),
  ]
}

function validateKeys(def: Record<string, unknown>, known: string[] = KNOWN_KEYS, label = ''): string[] {
  const unknown = Object.keys(def).filter(key => !known.includes(key))
  if (unknown.length === 0) {
    return []
  }
  const names = unknown.map(key => `"${key}"`).join(', ')
  return [`Unknown ${label}propert${unknown.length === 1 ? 'y' : 'ies'} ${names}. Expected one of: ${known.join(', ')}`]
}

function validateEnvelopeKeys(envelope: Record<string, unknown>, label: string): string[] {
  return validateKeys(envelope, KNOWN_ENVELOPE_KEYS, `${label.toLowerCase()} envelope `)
}

function validateWaveType(waveType: unknown): string[] {
  if (waveType === undefined || WAVE_TYPES.includes(waveType as WaveType)) {
    return []
  }
  return [`Invalid waveType "${waveType}". Expected one of: ${WAVE_TYPES.join(', ')}`]
}

function validatePartials(def: Record<string, unknown>): string[] {
  const { partials, waveType } = def

  if (partials !== undefined) {
    if (!Array.isArray(partials)) {
      return ['Partials must be an array of harmonic amplitudes.']
    }
    if (!partials.every(value => typeof value === 'number' && Number.isFinite(value))) {
      return ['Partials must contain only finite numbers.']
    }
    if (partials.length > MAX_PARTIALS) {
      return [`Too many partials: ${partials.length}. At most ${MAX_PARTIALS} harmonics are supported.`]
    }
  }

  if (waveType === 'custom' && !(Array.isArray(partials) && partials.some(value => value !== 0))) {
    return ['A "custom" waveType requires a non-empty "partials" array of harmonic amplitudes.']
  }
  return []
}

function validateFrequency(frequency: unknown): string[] {
  if (frequency === undefined || frequency === null) {
    return ['Sound definition is missing required "frequency" property.']
  }
  if (typeof frequency === 'number') {
    return isFrequencyInRange(frequency) ? [] : [invalidFrequency('number', frequency)]
  }
  if (typeof frequency !== 'object') {
    return ['Frequency must be either a number or an object with start and steps.']
  }

  const envelope = frequency as Record<string, unknown>
  const errors: string[] = validateEnvelopeKeys(envelope, 'Frequency')

  if (!isFrequencyInRange(envelope.start)) {
    errors.push(invalidFrequency('start', envelope.start))
  }
  if (!Array.isArray(envelope.steps)) {
    errors.push('Frequency steps must be an array.')
    return errors
  }
  errors.push(...validateInterpolation(envelope.interpolation, 'Frequency'))
  errors.push(...validateSteps(envelope.steps, 'Frequency', isFrequencyInRange, invalidFrequency))
  return errors
}

function validateGain(gain: unknown): string[] {
  if (gain === undefined || gain === null) {
    return []
  }
  if (typeof gain === 'number') {
    return isGainInRange(gain) ? [] : [invalidGain('number', gain)]
  }
  if (typeof gain !== 'object') {
    return ['Gain must be either a number or an object with start and steps.']
  }

  const envelope = gain as Record<string, unknown>
  const errors: string[] = validateEnvelopeKeys(envelope, 'Gain')

  if (!isGainInRange(envelope.start)) {
    errors.push(invalidGain('start', envelope.start))
  }
  if (!Array.isArray(envelope.steps)) {
    errors.push('Gain steps must be an array.')
    return errors
  }
  errors.push(...validateInterpolation(envelope.interpolation, 'Gain'))
  errors.push(...validateSteps(envelope.steps, 'Gain', isGainInRange, invalidGain))
  return errors
}

function validateSteps(
  steps: unknown[],
  label: string,
  isInRange: (value: unknown) => boolean,
  invalid: (label: string, value: unknown) => string,
): string[] {
  return steps.flatMap((step, index) => {
    if (!isWellFormedStep(step)) {
      return [`${label} step at index ${index} is malformed. Expected { value: number, time: number }.`]
    }
    const { value, time } = step as { value: number, time: number }
    const errors: string[] = []
    // A negative offset would schedule the step before the sound starts, where it is unreachable
    if (time < 0) {
      errors.push(`Invalid ${label.toLowerCase()} step time at index ${index}: ${time}. Must be an offset of at least 0 seconds from the sound's start.`)
    }
    if (!isInRange(value)) {
      errors.push(invalid(`step at index ${index}`, value))
    }
    return errors
  })
}

function validateTiming(def: Record<string, unknown>): string[] {
  const errors: string[] = []

  if (def.duration !== undefined && !isDurationInRange(def.duration)) {
    errors.push(`Invalid duration: ${def.duration}. Must be a finite number of at least ${MIN_DURATION_S}.`)
  }
  if (def.attack !== undefined && !isNonNegativeNumber(def.attack)) {
    errors.push(`Invalid attack: ${def.attack}. Must be a non-negative number.`)
  }
  if (def.decay !== undefined && !isNonNegativeNumber(def.decay)) {
    errors.push(`Invalid decay: ${def.decay}. Must be a non-negative number.`)
  }
  return errors
}

function validateInterpolation(interpolation: unknown, label: string): string[] {
  if (interpolation === undefined || INTERPOLATIONS.includes(interpolation as string)) {
    return []
  }
  return [`Invalid ${label.toLowerCase()} interpolation "${interpolation}". Expected one of: ${INTERPOLATIONS.join(', ')}`]
}

function isFrequencyInRange(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= MAX_FREQUENCY_HZ
}

function isGainInRange(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_GAIN
}

function invalidFrequency(label: string, value: unknown): string {
  return `Invalid frequency ${label}: ${String(value)}. Must be a finite number greater than 0 and at most ${MAX_FREQUENCY_HZ}.`
}

function invalidGain(label: string, value: unknown): string {
  return `Invalid gain ${label}: ${String(value)}. Must be a finite number between 0 and ${MAX_GAIN}.`
}

function isWellFormedStep(step: unknown): boolean {
  return Boolean(step)
    && typeof step === 'object'
    && Number.isFinite((step as { value?: unknown }).value)
    && Number.isFinite((step as { time?: unknown }).time)
}

function isDurationInRange(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= MIN_DURATION_S
}

function isNonNegativeNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}
