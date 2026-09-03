// Consumes the packed tarballs as a Node ESM user does (nodenext, no lib.dom, no skipLibCheck); guards published .d.ts
import type { EnvelopeDefinition, PlaybackHandle, SoundDefinition, SoundPack, SoundStep, WaveType } from '@rjvr/buzzsaw'
import type { WavBitDepth, WavHeaderInfo } from '@rjvr/buzzsaw-wav'
import type { DefaultSoundName } from '@rjvr/buzzsaw/sounds'
import {
  calculateEffectiveDuration,
  MAX_FREQUENCY_HZ,
  MAX_GAIN,
  MIN_DURATION_S,
  SoundManager,
  SoundValidationError,
  validateSoundDefinition,
} from '@rjvr/buzzsaw'
import { WavEncoder } from '@rjvr/buzzsaw-wav'
import { coinCollect, DEFAULT_SOUNDS, laserShot } from '@rjvr/buzzsaw/sounds'

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`consumer check failed: ${message}`)
  }
}

const waveType: WaveType = 'square'
const sweep: EnvelopeDefinition = { start: 880, steps: [{ value: 220, time: 0.15 } satisfies SoundStep] }
const preset: DefaultSoundName = 'coinCollect'
assert(MAX_GAIN === 1 && MAX_FREQUENCY_HZ === 20000 && MIN_DURATION_S === 0.01, 'documented limits are exported')
assert(preset in DEFAULT_SOUNDS, 'DefaultSoundName covers the preset map')

const blip: SoundDefinition = {
  waveType,
  frequency: sweep,
  gain: 0.4,
  duration: 0.2,
}

assert(validateSoundDefinition(blip).length === 0, 'hand-written definition validates')
assert(calculateEffectiveDuration(blip) === 0.2, 'attack and decay stay inside duration')

const manager = new SoundManager().register('blip', blip).registerAll({ coinCollect, laserShot })
// `list()` must return the names `play()` accepts, without a cast
const names: Array<'blip' | 'coinCollect' | 'laserShot'> = manager.list()
assert(names.length === 3, 'every registered name is listed')
// Not called: playback needs an AudioContext this check deliberately does not provide
const play: (name: (typeof names)[number]) => Promise<PlaybackHandle | null> = async name => manager.play(name)
assert(typeof play === 'function', 'listed names are accepted by play')

const pack: SoundPack = { version: 1, sounds: { blip, coinCollect } }
assert(Object.keys(DEFAULT_SOUNDS).length > 100 && pack.version === 1, 'presets and pack types resolve')

try {
  validateSoundDefinitionOrThrow({ frequency: -1 })
  assert(false, 'invalid definition throws')
}
catch (error) {
  assert(error instanceof SoundValidationError, 'invalid definition throws SoundValidationError')
}

function validateSoundDefinitionOrThrow(definition: unknown): void {
  const errors = validateSoundDefinition(definition)
  if (errors.length > 0) {
    throw new SoundValidationError('anonymous', errors)
  }
}

const blob = WavEncoder.encodeToBlob([new Float32Array([0, 0.25])], { sampleRate: 8000 })
assert(blob.size === 44 + 4 && blob.type === 'audio/wav', 'Blob-returning APIs typecheck without lib.dom')

// Transcribed from the READMEs so a published example cannot drift out of validity
const powerDown: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: { start: 800, steps: [{ value: 400, time: 0.2 }, { value: 100, time: 0.5 }] },
  gain: { start: 0.5, interpolation: 'linear', steps: [{ value: 0.3, time: 0.3 }, { value: 0.1, time: 0.5 }] },
  duration: 0.6,
  decay: 0.15,
}
const coin: SoundDefinition = {
  waveType: 'square',
  frequency: { start: 987, steps: [{ value: 1318, time: 0.08 }] },
  duration: 0.3,
  gain: 0.3,
}
const laser: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: { start: 1200, steps: [{ value: 200, time: 0.15 }] },
  gain: 0.4,
  duration: 0.2,
}
for (const [name, definition] of Object.entries({ powerDown, coin, laser })) {
  assert(validateSoundDefinition(definition).length === 0, `README example "${name}" validates`)
}
assert(calculateEffectiveDuration({ frequency: 440, duration: 0.2, decay: 0.5 }) === 0.2, 'README: decay never extends duration')
assert(
  calculateEffectiveDuration({ frequency: { start: 440, steps: [{ value: 880, time: 2 }] }, duration: 0.2 }) === 2.01,
  'README: a step past duration extends to that step plus a 10 ms tail',
)

const bitDepth: WavBitDepth = 16
const wav = WavEncoder.encode([new Float32Array([0, 0.5, -0.5, 0])], { sampleRate: 8000, bitDepth })
const header: WavHeaderInfo | null = WavEncoder.decodeHeader(wav)
assert(header !== null && header.bitDepth === 16 && header.sampleRate === 8000, 'encoded WAV has a decodable header')
