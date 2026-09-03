import { MAX_PARTIALS, WAVE_TYPES } from './constants'

/** Returns validation errors, or empty array if valid */
export function validateSoundDefinition(def: unknown): string[] {
  if (!def || typeof def !== 'object') {
    return ['Sound definition must be a non-null object.']
  }

  const candidate = def as Record<string, unknown>

  return [
    ...validateWaveType(candidate.waveType),
    ...validatePartials(candidate),
    ...validateFrequency(candidate.frequency),
    ...validateGain(candidate.gain),
    ...validateTiming(candidate),
  ]
}

function validateWaveType(waveType: unknown): string[] {
  if (waveType === undefined || WAVE_TYPES.includes(waveType as OscillatorType)) {
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
    return Number.isFinite(frequency) && frequency > 0
      ? []
      : [`Invalid frequency number: ${frequency}. Must be a positive finite number.`]
  }
  if (typeof frequency !== 'object') {
    return ['Frequency must be either a number or an object with start and steps.']
  }

  const envelope = frequency as Record<string, unknown>
  const errors: string[] = []

  if (typeof envelope.start !== 'number' || !Number.isFinite(envelope.start) || envelope.start <= 0) {
    errors.push(`Invalid frequency start: ${envelope.start}. Must be a positive finite number.`)
  }
  if (!Array.isArray(envelope.steps)) {
    errors.push('Frequency steps must be an array.')
    return errors
  }
  envelope.steps.forEach((step, index) => {
    if (!isWellFormedStep(step)) {
      errors.push(`Frequency step at index ${index} is malformed. Expected { value: number, time: number }.`)
    }
  })
  return errors
}

function validateGain(gain: unknown): string[] {
  if (gain === undefined || gain === null) {
    return []
  }
  if (typeof gain === 'number') {
    return Number.isFinite(gain) && gain >= 0
      ? []
      : [`Invalid gain number: ${gain}. Must be a non-negative finite number.`]
  }
  if (typeof gain !== 'object') {
    return []
  }

  const envelope = gain as Record<string, unknown>
  const errors: string[] = []

  if (typeof envelope.start !== 'number' || !Number.isFinite(envelope.start) || envelope.start < 0) {
    errors.push(`Invalid gain start: ${envelope.start}. Must be a non-negative finite number.`)
  }
  if (!Array.isArray(envelope.steps)) {
    errors.push('Gain steps must be an array.')
    return errors
  }
  envelope.steps.forEach((step, index) => {
    if (!isWellFormedStep(step)) {
      errors.push(`Gain step at index ${index} is malformed. Expected { value: number, time: number }.`)
    }
  })
  return errors
}

function validateTiming(def: Record<string, unknown>): string[] {
  const errors: string[] = []

  if (def.duration !== undefined && !isPositiveNumber(def.duration)) {
    errors.push(`Invalid duration: ${def.duration}. Must be a positive number.`)
  }
  if (def.attack !== undefined && !isNonNegativeNumber(def.attack)) {
    errors.push(`Invalid attack: ${def.attack}. Must be a non-negative number.`)
  }
  if (def.decay !== undefined && !isNonNegativeNumber(def.decay)) {
    errors.push(`Invalid decay: ${def.decay}. Must be a non-negative number.`)
  }
  return errors
}

function isWellFormedStep(step: unknown): boolean {
  return Boolean(step)
    && typeof step === 'object'
    && Number.isFinite((step as { value?: unknown }).value)
    && Number.isFinite((step as { time?: unknown }).time)
}

function isPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isNonNegativeNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}
