import type { EnvelopeDefinition, SoundDefinition, SoundStep } from '@rjvr/buzzsaw'
import { clamp, cloneSoundDefinition, validateSoundDefinition, WAVE_TYPES } from '@rjvr/buzzsaw'
import { MAX_PITCH_HZ } from '../audio/pitches'

export interface SoundPatch {
  name: string
  description: string
  definition: SoundDefinition
}

const LIMITS = {
  frequency: { min: 20, max: MAX_PITCH_HZ },
  gain: { min: 0.001, max: 0.8 },
  duration: { min: 0.015, max: 2.5 },
  attack: { min: 0.001, max: 0.4 },
  decay: { min: 0.005, max: 1.5 },
} as const

const DEFAULTS = {
  waveType: 'sine' as OscillatorType,
  frequency: 440,
  gain: 0.4,
  duration: 0.3,
  attack: 0.005,
  decay: 0.1,
} as const

const GENERATIVE_WAVE_TYPES: readonly string[] = WAVE_TYPES

// Harmonics beyond eighth add little model can reason about
const MAX_GENERATED_PARTIALS = 8

/** Parses and normalizes SoundPatch from raw model text; throws if invalid */
export function parseSoundPatch(text: string): SoundPatch {
  const json = isolateJsonObject(text)
  if (!json) {
    throw new Error(`Model returned no JSON object. Output began: ${text.slice(0, 120)}`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  }
  catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error'
    throw new Error(`Model returned malformed JSON (${reason}).`)
  }

  return normalizeSoundPatch(parsed)
}

/** Normalizes and bounds raw candidate object into valid SoundPatch; throws if invalid */
export function normalizeSoundPatch(raw: unknown): SoundPatch {
  if (!raw || typeof raw !== 'object') {
    throw new TypeError('Sound patch must be a JSON object.')
  }

  const candidate = raw as Record<string, unknown>
  const { waveType, partials } = normalizeTimbre(candidate.waveType, candidate.partials)
  const duration = clampNumber(candidate.duration, LIMITS.duration, DEFAULTS.duration)
  const attack = clamp(
    clampNumber(candidate.attack, LIMITS.attack, DEFAULTS.attack),
    LIMITS.attack.min,
    duration * 0.8,
  )
  const decay = clamp(
    clampNumber(candidate.decay, LIMITS.decay, DEFAULTS.decay),
    LIMITS.decay.min,
    Math.max(LIMITS.decay.min, duration - attack),
  )

  const definition: SoundDefinition = {
    waveType,
    ...(partials && { partials }),
    frequency: normalizeParameter(candidate.frequency, LIMITS.frequency, DEFAULTS.frequency, duration),
    gain: normalizeParameter(candidate.gain, LIMITS.gain, DEFAULTS.gain, duration),
    duration,
    attack,
    decay,
  }

  const errors = validateSoundDefinition(definition)
  if (errors.length > 0) {
    throw new Error(`Generated patch failed validation: ${errors.join('; ')}`)
  }

  return {
    name: normalizeName(candidate.name, waveType),
    description: normalizeDescription(candidate.description, waveType, definition.frequency),
    definition: cloneSoundDefinition(definition),
  }
}

interface Range {
  min: number
  max: number
}

// Collapses empty steps to scalar
function normalizeParameter(
  raw: unknown,
  range: Range,
  fallback: number,
  duration: number,
): number | EnvelopeDefinition {
  if (typeof raw === 'number') {
    return clampNumber(raw, range, fallback)
  }
  if (!raw || typeof raw !== 'object') {
    return fallback
  }

  const envelope = raw as Record<string, unknown>
  const start = clampNumber(envelope.start, range, fallback)
  const steps = normalizeSteps(envelope.steps, range, duration)

  return steps.length > 0 ? { start, steps } : start
}

function normalizeSteps(raw: unknown, range: Range, duration: number): SoundStep[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .filter((step): step is SoundStep =>
      Boolean(step) && Number.isFinite(step.value) && Number.isFinite(step.time))
    .map(step => ({
      value: clamp(step.value, range.min, range.max),
      time: clamp(step.time, 0.001, duration),
    }))
    .sort((a, b) => a.time - b.time)
}

interface Timbre {
  waveType: OscillatorType
  partials?: number[]
}

function normalizeTimbre(rawWaveType: unknown, rawPartials: unknown): Timbre {
  const waveType = normalizeWaveType(rawWaveType)
  if (waveType !== 'custom') {
    return { waveType }
  }

  const partials = normalizePartials(rawPartials)
  return partials ? { waveType, partials } : { waveType: DEFAULTS.waveType }
}

function normalizeWaveType(raw: unknown): OscillatorType {
  const candidate = typeof raw === 'string' ? raw.toLowerCase() : ''
  return GENERATIVE_WAVE_TYPES.includes(candidate)
    ? (candidate as OscillatorType)
    : DEFAULTS.waveType
}

function normalizePartials(raw: unknown): number[] | null {
  if (!Array.isArray(raw)) {
    return null
  }

  const levels = raw
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    .slice(0, MAX_GENERATED_PARTIALS)
    .map(value => clamp(value, 0, 1))

  return levels.some(level => level > 0) ? levels : null
}

function clampNumber(raw: unknown, range: Range, fallback: number): number {
  const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback
  return clamp(value, range.min, range.max)
}

function normalizeName(raw: unknown, waveType: OscillatorType): string {
  const cleaned = typeof raw === 'string' ? raw.trim().replace(/[^\w-]/g, '') : ''
  return cleaned || `ai_${waveType}_${Math.floor(Math.random() * 1000)}`
}

function normalizeDescription(
  raw: unknown,
  waveType: OscillatorType,
  frequency: number | EnvelopeDefinition,
): string {
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim()
  }
  const pitch = typeof frequency === 'number' ? `${Math.round(frequency)} Hz` : 'modulated pitch'
  return `Synthesized ${waveType} tone at ${pitch}.`
}

// Extracts JSON object substring, stripping code fences
function isolateJsonObject(text: string): string | null {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  return start !== -1 && end > start ? trimmed.slice(start, end + 1) : null
}
