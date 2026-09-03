import type { SoundDefinition } from '@rjvr/buzzsaw'
import { MUSICAL_PITCHES } from '../../audio/pitches'

interface Descriptor<T> {
  keywords: readonly string[]
  value: T
}

function pick<T>(prompt: string, table: readonly Descriptor<T>[], fallback: T): T {
  return table.find(({ keywords }) => keywords.some(word => prompt.includes(word)))?.value ?? fallback
}

const TIMBRES: readonly Descriptor<OscillatorType>[] = [
  { keywords: ['sharp', 'bright', 'harsh', 'distort', 'raspy'], value: 'sawtooth' },
  { keywords: ['retro', 'arcade', 'digital', 'hollow', 'bleep'], value: 'square' },
  { keywords: ['warm', 'soft', 'mellow', 'smooth', 'gentle'], value: 'triangle' },
]

const REGISTERS: readonly Descriptor<number>[] = [
  { keywords: ['ultra high', 'piercing', 'tiny'], value: 2400 },
  { keywords: ['high', 'treble', 'bright'], value: 1200 },
  { keywords: ['sub', 'ultra low', 'earthquake'], value: 55 },
  { keywords: ['low', 'deep', 'bass', 'dark'], value: MUSICAL_PITCHES.C3 },
]

interface EnvelopeShape {
  duration: number
  attack: number
  decay: number
}

const ENVELOPES: readonly Descriptor<EnvelopeShape>[] = [
  { keywords: ['ultra fast', 'micro', 'instant', 'tick'], value: { duration: 0.03, attack: 0.001, decay: 0.02 } },
  { keywords: ['short', 'quick', 'snappy', 'staccato'], value: { duration: 0.09, attack: 0.002, decay: 0.05 } },
  { keywords: ['long', 'slow', 'sustained', 'decay tail'], value: { duration: 0.9, attack: 0.02, decay: 0.6 } },
]

const DEFAULT_ENVELOPE: EnvelopeShape = { duration: 0.3, attack: 0.005, decay: 0.15 }
const RISING_WORDS = ['sweep up', 'rising', 'upward']
const FALLING_WORDS = ['dive', 'drop', 'sweep down', 'falling']

/** Synthesizes SoundDefinition from prompt adjectives; prompt must be lowercase */
export function synthesizeFromDescriptors(prompt: string): SoundDefinition {
  const waveType = pick(prompt, TIMBRES, 'sine')
  const pitch = pick(prompt, REGISTERS, MUSICAL_PITCHES.A4)
  const envelope = pick(prompt, ENVELOPES, DEFAULT_ENVELOPE)

  return {
    waveType,
    frequency: resolvePitchMotion(prompt, pitch, envelope.duration),
    gain: 0.4,
    ...envelope,
  }
}

function resolvePitchMotion(
  prompt: string,
  pitch: number,
  duration: number,
): SoundDefinition['frequency'] {
  if (RISING_WORDS.some(word => prompt.includes(word))) {
    return { start: pitch, steps: [{ value: pitch * 2, time: duration * 0.7 }] }
  }
  if (FALLING_WORDS.some(word => prompt.includes(word))) {
    return { start: pitch * 2, steps: [{ value: pitch * 0.4, time: duration * 0.8 }] }
  }
  return pitch
}

export function describeDescriptorPatch(definition: SoundDefinition, prompt: string): string {
  const pitch = typeof definition.frequency === 'number'
    ? `${Math.round(definition.frequency)} Hz`
    : 'a modulated pitch'
  return `Shaped a ${definition.waveType} patch at ${pitch} for "${prompt}".`
}
