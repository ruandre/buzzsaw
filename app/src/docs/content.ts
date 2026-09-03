import type { SoundDefinition } from '@rjvr/buzzsaw'

export type DocTopicId = 'quickstart' | 'synthesis' | 'envelopes' | 'wav' | 'types'

export type DocBlock
  = | { kind: 'prose', text: string }
    | { kind: 'code', language: string, code: string }
    | { kind: 'terms', terms: readonly { term: string, description: string }[] }
  /** Package manager switcher and install command */
    | { kind: 'install' }
  /** Playable example sounds */
    | { kind: 'examples' }

export interface DocTopic {
  id: DocTopicId
  label: string
  icon: string
  title: string
  intro: string
  blocks: readonly DocBlock[]
}

export interface DocExample {
  name: string
  description: string
  definition: SoundDefinition
}

export const DOC_EXAMPLES: readonly DocExample[] = [
  {
    name: 'laserShot',
    description: 'Sawtooth pitch dive. The whole sound is one steep frequency ramp.',
    definition: {
      waveType: 'sawtooth',
      frequency: { start: 1600, steps: [{ value: 120, time: 0.12 }] },
      gain: 0.4,
      duration: 0.15,
      attack: 0.002,
      decay: 0.08,
    },
  },
  {
    name: 'crystalChime',
    description: 'Three ascending sine harmonics with a long decay tail.',
    definition: {
      waveType: 'sine',
      frequency: {
        start: 880,
        steps: [
          { value: 1318.51, time: 0.08 },
          { value: 1760, time: 0.18 },
        ],
      },
      gain: 0.35,
      duration: 0.55,
      attack: 0.005,
      decay: 0.38,
    },
  },
  {
    name: 'retroJump',
    description: 'Square wave sweeping upward. The classic chiptune jump.',
    definition: {
      waveType: 'square',
      frequency: { start: 220, steps: [{ value: 880, time: 0.12 }] },
      gain: 0.3,
      duration: 0.16,
      attack: 0.003,
      decay: 0.07,
    },
  },
  {
    name: 'crispClick',
    description: 'A 30 ms sine burst: the shortest useful UI feedback.',
    definition: {
      waveType: 'sine',
      frequency: 1400,
      gain: 0.3,
      duration: 0.03,
      attack: 0.001,
      decay: 0.02,
    },
  },
]

export const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn', 'bun', 'nub'] as const
export type PackageManager = (typeof PACKAGE_MANAGERS)[number]

const INSTALL_VERBS: Record<PackageManager, string> = {
  pnpm: 'pnpm add',
  npm: 'npm install',
  yarn: 'yarn add',
  bun: 'bun add',
  nub: 'nub add',
}

export function installCommand(manager: PackageManager): string {
  return `${INSTALL_VERBS[manager]} @rjvr/buzzsaw @rjvr/buzzsaw-wav`
}

export const DOC_TOPICS: readonly DocTopic[] = [
  {
    id: 'quickstart',
    label: 'Quick start',
    icon: 'i-ph-rocket-launch-bold',
    title: 'Quick start',
    intro: 'Two packages, no runtime dependencies, no audio files. Sounds are described as data and synthesized in the browser.',
    blocks: [
      { kind: 'install' },
      {
        kind: 'prose',
        text: '`@rjvr/buzzsaw` synthesizes and plays. `@rjvr/buzzsaw-wav` renders the same definitions to `.wav` files offline. They ship separately, so install only what you use.',
      },
      {
        kind: 'code',
        language: 'typescript',
        code: `import { SoundManager } from '@rjvr/buzzsaw'
import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'

// A manager starts empty; the 113 presets are a separate import
const sounds = new SoundManager().registerAll(DEFAULT_SOUNDS)

// Browsers block audio until the user interacts, so play from a handler
button.addEventListener('click', () => sounds.play('ding'))`,
      },
      {
        kind: 'prose',
        text: 'The pack is optional. Skip it and you bundle only the sounds you register yourself.',
      },
      {
        kind: 'code',
        language: 'typescript',
        code: `// register() returns the manager, widened so play() accepts the new name
const sounds = new SoundManager().register('confirm', {
  waveType: 'triangle',
  frequency: { start: 659.25, steps: [{ value: 880, time: 0.07 }] },
  gain: 0.38,
  duration: 0.22,
  attack: 0.004,
  decay: 0.12,
})

const handle = await sounds.play('confirm', { volume: 0.8 })
handle?.stop() // fades out over 5ms rather than cutting`,
      },
    ],
  },
  {
    id: 'synthesis',
    label: 'Synthesis',
    icon: 'i-ph-sliders-bold',
    title: 'Designing a sound',
    intro: 'Every sound is one oscillator through one gain node. Four parameters decide how it reads: timbre, pitch, envelope, and level.',
    blocks: [
      {
        kind: 'terms',
        terms: [
          { term: 'sine', description: 'No harmonics. Clicks, bubbles, sub-bass, bells, anything that should not draw attention.' },
          { term: 'triangle', description: 'Soft odd harmonics. Plucks, marimba, warm leads, gentle feedback.' },
          { term: 'sawtooth', description: 'All harmonics, bright and cutting. Lasers, sirens, brass, glitches.' },
          { term: 'square', description: 'Hollow odd harmonics. 8-bit arcade, chiptune, robot chirps.' },
          { term: 'custom', description: 'A harmonic series you write yourself. Reeds, organs, metallic timbres none of the four shapes reach.' },
        ],
      },
      { kind: 'examples' },
      {
        kind: 'prose',
        text: 'A `custom` waveType takes a `partials` array: entry *n* is the relative amplitude of harmonic *n + 1*. The series is normalized to unit peak, so only the ratios matter.',
      },
      {
        kind: 'code',
        language: 'typescript',
        code: `// Fundamental plus odd harmonics: hollow, clarinet-like
const reed = {
  waveType: 'custom',
  partials: [1, 0, 0.33, 0, 0.2, 0, 0.14],
  frequency: 330,
  duration: 0.4,
}`,
      },
      {
        kind: 'prose',
        text: 'Play a definition directly when you do not need a registry.',
      },
      {
        kind: 'code',
        language: 'typescript',
        code: `import {
  ensureAudioContextReady,
  playSoundFromDefinition,
} from '@rjvr/buzzsaw'

const ctx = await ensureAudioContextReady()
const handle = playSoundFromDefinition(ctx, {
  waveType: 'sawtooth',
  frequency: { start: 1600, steps: [{ value: 120, time: 0.12 }] },
  gain: 0.4,
  duration: 0.15,
  attack: 0.002,
  decay: 0.08,
})

await handle.promise // resolves when the sound finishes`,
      },
    ],
  },
  {
    id: 'envelopes',
    label: 'Envelopes',
    icon: 'i-ph-waveform-bold',
    title: 'Envelopes and pitch contours',
    intro: 'Frequency and gain each accept a number for a constant value, or an envelope of timed steps for a contour.',
    blocks: [
      {
        kind: 'code',
        language: 'typescript',
        code: `// Constant pitch
{ frequency: 440 }

// Contour: starts at 2000 Hz, ramps to 90 Hz over 120ms
{ frequency: { start: 2000, steps: [{ value: 90, time: 0.12 }] } }`,
      },
      {
        kind: 'terms',
        terms: [
          { term: 'attack', description: 'Rise time to peak. Under 4 ms reads as percussive; over 40 ms reads as a swell.' },
          { term: 'decay', description: 'Release tail. Long decays give bells and sub-drops their resonance.' },
          { term: 'duration', description: 'Total length. Envelope steps past it extend the sound rather than being cut.' },
        ],
      },
      {
        kind: 'prose',
        text: 'Frequency steps ramp linearly between points. Gain steps hold their value until the next one, which makes stepped gain useful for pulsing and stutter effects. Set `interpolation` on either envelope to override its default.',
      },
      {
        kind: 'code',
        language: 'typescript',
        code: `// Dual-burst alarm: pitch alternates, gain gates on and off
{
  waveType: 'square',
  frequency: {
    start: 960,
    steps: [{ value: 640, time: 0.12 }, { value: 960, time: 0.24 }],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.45, time: 0.01 },
      { value: 0.05, time: 0.11 },
      { value: 0.45, time: 0.13 },
      { value: 0.001, time: 0.32 },
    ],
  },
  duration: 0.45,
  attack: 0.005,
  decay: 0.05,
}`,
      },
      {
        kind: 'prose',
        text: 'Sample an envelope yourself to draw it. That is what the oscilloscope on this site does.',
      },
      {
        kind: 'code',
        language: 'typescript',
        code: `import {
  calculateEffectiveDuration,
  sampleFrequencyAtTime,
  sampleGainAtTime,
} from '@rjvr/buzzsaw'

const duration = calculateEffectiveDuration(definition)
const hz = sampleFrequencyAtTime(definition, 0.05)
const level = sampleGainAtTime(definition, 0.05, duration)`,
      },
    ],
  },
  {
    id: 'wav',
    label: 'WAV export',
    icon: 'i-ph-download-simple-bold',
    title: 'Rendering to WAV',
    intro: '`@rjvr/buzzsaw-wav` renders definitions through an OfflineAudioContext, faster than real time and silent.',
    blocks: [
      {
        kind: 'code',
        language: 'typescript',
        code: `import { WavExporter } from '@rjvr/buzzsaw-wav'

// Straight to the user's downloads
await WavExporter.downloadWav(definition, 'laser.wav')

// Or keep the bytes
const blob = await WavExporter.renderToWavBlob(definition, {
  sampleRate: 44100,
  bitDepth: 16,
  numChannels: 1,
})`,
      },
      {
        kind: 'terms',
        terms: [
          { term: 'sampleRate', description: 'Hz. 44100 for general use, 22050 for small game assets, 48000 for video.' },
          { term: 'bitDepth', description: '8, 16, or 24 for integer PCM; 32 writes IEEE float.' },
          { term: 'numChannels', description: 'Mono by default. Higher counts duplicate the rendered channel.' },
        ],
      },
      {
        kind: 'prose',
        text: 'Batch-render a whole sound pack without touching the DOM.',
      },
      {
        kind: 'code',
        language: 'typescript',
        code: `import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'
import {
  WavEncoder,
  WavExporter,
} from '@rjvr/buzzsaw-wav'

for (const [name, definition] of Object.entries(DEFAULT_SOUNDS)) {
  const bytes = await WavExporter.renderToWavArrayBuffer(definition)
  const header = WavEncoder.decodeHeader(bytes)
  console.log(name, header?.duration.toFixed(3), 'seconds')
}`,
      },
    ],
  },
  {
    id: 'types',
    label: 'Reference',
    icon: 'i-ph-code-bold',
    title: 'Type reference',
    intro: 'The full shape of a sound. Every field except `frequency` has a default.',
    blocks: [
      {
        kind: 'code',
        language: 'typescript',
        code: `interface SoundDefinition {
  waveType?: WaveType                    // default 'sine'
  partials?: number[]                    // harmonic amplitudes, for waveType 'custom'
  frequency: number | EnvelopeDefinition // Hz, above 0 and at most 20000
  gain?: number | EnvelopeDefinition     // 0 to 1, default 0.5
  duration?: number                      // seconds, default 0.5
  attack?: number                        // seconds, default 0.005
  decay?: number                         // seconds, default 0.1
}

interface EnvelopeDefinition {
  start: number
  steps: { value: number, time: number }[]
  interpolation?: 'linear' | 'step'      // default 'linear' for frequency, 'step' for gain
}

interface PlaybackHandle {
  stop: () => void
  readonly isPlaying: boolean
  readonly promise: Promise<void>
}`,
      },
      {
        kind: 'prose',
        text: 'Definitions arriving from JSON or user input are untrusted. Validate before playing them.',
      },
      {
        kind: 'code',
        language: 'typescript',
        code: `import {
  isValidSoundDefinition,
  validateSoundDefinition,
} from '@rjvr/buzzsaw'

if (isValidSoundDefinition(incoming)) {
  sounds.register('imported', incoming)
} else {
  console.error(validateSoundDefinition(incoming)) // all validation errors
}`,
      },
    ],
  },
]
