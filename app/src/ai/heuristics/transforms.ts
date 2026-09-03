import type { SoundDefinition } from '@rjvr/buzzsaw'
import { clamp, isEnvelope, round } from '@rjvr/buzzsaw'
import { MAX_PITCH_HZ } from '../../audio/pitches'

// Applied in order; at most one transform per group executes
const MIN_PITCH_HZ = 25

export interface Transform {
  keywords: readonly string[]
  summary: string
  apply: (def: SoundDefinition) => void
}

const timbre: readonly Transform[] = [
  {
    keywords: ['8bit', '8-bit', 'square', 'chiptune', 'arcade', 'retro'],
    summary: 'square 8-bit timbre',
    apply: def => void (def.waveType = 'square'),
  },
  {
    keywords: ['sawtooth', 'saw', 'laser', 'harsh', 'buzzy', 'aggressive', 'edgy'],
    summary: 'sawtooth harmonics',
    apply: def => void (def.waveType = 'sawtooth'),
  },
  {
    keywords: ['sine', 'pure', 'clean', 'smooth', 'liquid', 'water'],
    summary: 'pure sine timbre',
    apply: def => void (def.waveType = 'sine'),
  },
  {
    keywords: ['triangle', 'warm', 'acoustic', 'pluck', 'wood', 'mellow'],
    summary: 'warm triangle timbre',
    apply: def => void (def.waveType = 'triangle'),
  },
]

const pitchShift: readonly Transform[] = [
  {
    keywords: ['octave up', '+1 octave', 'up 1 octave', 'up one octave', 'up an octave', 'higher octave', 'double pitch'],
    summary: 'pitched up an octave',
    apply: def => scalePitch(def, 2),
  },
  {
    keywords: ['octave down', '-1 octave', 'down 1 octave', 'down one octave', 'down an octave', 'lower octave', 'half pitch'],
    summary: 'pitched down an octave',
    apply: def => scalePitch(def, 0.5),
  },
  {
    keywords: ['higher', 'high pitch', 'treble', 'sharper pitch', 'up pitch', 'raise pitch'],
    summary: 'raised pitch',
    apply: def => scalePitch(def, 1.5),
  },
  {
    keywords: ['lower', 'low pitch', 'bassier', 'deep', 'sub', 'darker', 'drop pitch'],
    summary: 'lowered pitch',
    apply: def => scalePitch(def, 0.65),
  },
]

const pitchMotion: readonly Transform[] = [
  {
    keywords: ['pitch dive', 'laser dive', 'drop pitch', 'down sweep'],
    summary: 'pitch dive',
    apply: (def) => {
      const root = rootFrequency(def, 880)
      def.frequency = {
        start: Math.max(root * 2, 1600),
        steps: [{ value: Math.max(40, root * 0.2), time: round(durationOf(def) * 0.8, 3) }],
      }
    },
  },
  {
    keywords: ['arpeggio', 'scale', 'triad', 'ascending note', 'climb'],
    summary: 'ascending arpeggio',
    apply: (def) => {
      const root = rootFrequency(def, 440)
      const duration = durationOf(def)
      def.frequency = {
        start: root,
        steps: [1.25, 1.5, 2].map((ratio, index) => ({
          value: round(root * ratio, 2),
          time: round(duration * 0.25 * (index + 1), 3),
        })),
      }
    },
  },
  {
    keywords: ['wobble', 'vibrato', 'siren', 'trill'],
    summary: 'vibrato oscillation',
    apply: (def) => {
      const root = rootFrequency(def, 600)
      const duration = durationOf(def)
      def.frequency = {
        start: root,
        steps: [1.3, 1, 1.3, 1].map((ratio, index) => ({
          value: round(root * ratio, 2),
          time: round(duration * 0.2 * (index + 1), 3),
        })),
      }
    },
  },
]

const envelope: readonly Transform[] = [
  {
    keywords: ['punchier', 'snappy', 'shorter', 'faster', 'staccato', 'micro'],
    summary: 'snappier transient',
    apply: (def) => {
      def.duration = Math.max(0.02, round(durationOf(def) * 0.55, 3))
      def.attack = 0.001
      def.decay = Math.max(0.01, round(def.duration * 0.6, 3))
    },
  },
  {
    keywords: ['longer', 'slower', 'resonant', 'reverb', 'tail', 'echo', 'sustain'],
    summary: 'extended resonant tail',
    apply: (def) => {
      def.duration = Math.min(2.2, round(durationOf(def) * 1.8, 3))
      def.decay = Math.min(def.duration * 0.8, round((def.decay ?? 0.1) * 2.2, 3))
    },
  },
]

const level: readonly Transform[] = [
  {
    keywords: ['pulse', 'alarm', 'stutter', 'tremolo', 'double beep'],
    summary: 'pulsing gain envelope',
    apply: (def) => {
      const duration = durationOf(def)
      def.gain = {
        start: 0.001,
        steps: [
          { value: 0.45, time: round(duration * 0.05, 3) },
          { value: 0.001, time: round(duration * 0.35, 3) },
          { value: 0.45, time: round(duration * 0.55, 3) },
          { value: 0.001, time: round(duration * 0.85, 3) },
        ],
      }
    },
  },
  {
    keywords: ['louder', 'boost volume'],
    summary: 'boosted level',
    apply: (def) => {
      if (typeof def.gain === 'number') {
        def.gain = Math.min(0.8, round(def.gain * 1.4, 2))
      }
    },
  },
  {
    keywords: ['softer', 'quieter'],
    summary: 'reduced level',
    apply: (def) => {
      if (typeof def.gain === 'number') {
        def.gain = Math.max(0.1, round(def.gain * 0.65, 2))
      }
    },
  },
]

export const TRANSFORM_GROUPS: readonly (readonly Transform[])[] = [
  timbre,
  pitchShift,
  pitchMotion,
  envelope,
  level,
]

/** Modifies def in place; instruction must be lowercase */
export function applyTransforms(def: SoundDefinition, instruction: string): string[] {
  const applied: string[] = []

  for (const group of TRANSFORM_GROUPS) {
    const match = group.find(({ keywords }) => keywords.some(word => instruction.includes(word)))
    if (match) {
      match.apply(def)
      applied.push(match.summary)
    }
  }

  return applied
}

function scalePitch(def: SoundDefinition, factor: number): void {
  const scaled = (value: number) => clamp(round(value * factor, 2), MIN_PITCH_HZ, MAX_PITCH_HZ)

  if (typeof def.frequency === 'number') {
    def.frequency = scaled(def.frequency)
    return
  }
  if (isEnvelope(def.frequency)) {
    def.frequency.start = scaled(def.frequency.start)
    for (const step of def.frequency.steps ?? []) {
      step.value = scaled(step.value)
    }
  }
}

function rootFrequency(def: SoundDefinition, fallback: number): number {
  if (typeof def.frequency === 'number') {
    return def.frequency
  }
  return isEnvelope(def.frequency) ? def.frequency.start : fallback
}

function durationOf(def: SoundDefinition): number {
  return def.duration ?? 0.3
}
