# @rjvr/buzzsaw

Zero-dependency Web Audio synthesizer, sound registry, and parameter automation library for TypeScript and JavaScript.

Instead of loading static audio files over the network, define sound effects as small JSON data objects. Buzzsaw synthesizes them on demand using Web Audio oscillators and gain envelopes.

## Installation

```bash
npm install @rjvr/buzzsaw
# or: pnpm add / yarn add / bun add
```

The core package has no dependencies and tree-shakes cleanly. The built-in library of 80+ presets is exported from a separate subpath (`@rjvr/buzzsaw/sounds`), so applications with custom sounds never bundle them.

## Quick start

### Play a single sound

Use `Sound` to define and play an isolated sound effect:

```ts
import { Sound } from '@rjvr/buzzsaw'

const laser = new Sound('laser', {
  waveType: 'sawtooth',
  frequency: {
    start: 1200,
    steps: [{ value: 200, time: 0.15 }],
  },
  gain: 0.4,
  duration: 0.2,
})

// Play immediately using the shared AudioContext
const handle = await laser.play()

// Stop before the sound finishes (ramps down smoothly without clicks)
handle.stop()

// Or wait until playback finishes
await handle.promise
```

### Manage sound collections

Use `SoundManager` to group sounds under a shared master volume, optional limiter, and single audio context:

```ts
import { SoundManager } from '@rjvr/buzzsaw'
import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'

const sounds = new SoundManager({ masterVolume: 0.8, limiter: true })

// Register the preset pack
sounds.registerAll(DEFAULT_SOUNDS)

// Register your own sound definitions
sounds.register('coin', {
  waveType: 'square',
  frequency: {
    start: 987,
    steps: [{ value: 1318, time: 0.08 }],
  },
  duration: 0.3,
  gain: 0.3,
})

// Play by name with volume or pitch scaling
const handle = await sounds.play('coin', { volume: 0.9, pitchScale: 1.2 })
```

### Browser autoplay

Browsers suspend Web Audio until the user interacts with the page. Call `ensureAudioContextReady` inside a user interaction handler to initialize or resume the context:

```ts
import { ensureAudioContextReady } from '@rjvr/buzzsaw'

window.addEventListener('pointerdown', () => ensureAudioContextReady(), { once: true })
```

## Sound definitions

Every sound is described by a `SoundDefinition` object. Only `frequency` is required.

```ts
interface SoundDefinition {
  /** Waveform shape. Defaults to 'sine' */
  waveType?: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'custom'

  /** Harmonic amplitudes. Required when waveType is 'custom'. Up to 64 partials */
  partials?: number[]

  /** Base pitch in Hz, or an envelope contour over time */
  frequency: number | EnvelopeDefinition

  /** Peak amplitude from 0 to 1, or an envelope contour. Defaults to 0.5 */
  gain?: number | EnvelopeDefinition

  /** Playback duration in seconds. Defaults to 0.5 */
  duration?: number

  /** Attack ramp-in duration in seconds. Defaults to 0.005 */
  attack?: number

  /** Decay ramp-out duration in seconds. Defaults to 0.1 */
  decay?: number
}
```

### Envelopes

Both `frequency` and `gain` accept automation envelopes:

```ts
interface EnvelopeDefinition {
  /** Initial value at time 0 */
  start: number
  /** Automation targets ordered by offset in seconds from sound start */
  steps: { value: number, time: number }[]
}
```

- Frequency envelopes interpolate smoothly using linear ramps between steps.
- Gain envelopes apply stepped values at each target time, followed by an exponential ramp down to silence during the decay window.

Example with frequency and gain contours:

```ts
const powerDown = new Sound('powerDown', {
  waveType: 'sawtooth',
  frequency: {
    start: 800,
    steps: [
      { value: 400, time: 0.2 },
      { value: 100, time: 0.5 },
    ],
  },
  gain: {
    start: 0.5,
    steps: [
      { value: 0.3, time: 0.3 },
      { value: 0.1, time: 0.5 },
    ],
  },
  duration: 0.6,
  decay: 0.15,
})
```

## Playback handles

Calling `play()` on a `Sound` or `SoundManager` schedules the voice immediately and returns a `PlaybackHandle`:

```ts
interface PlaybackHandle {
  /** Immediately stops playback with an exponential fade to prevent clicks */
  stop: () => void

  /** True while the voice is actively scheduled or rendering */
  readonly isPlaying: boolean

  /** Resolves when the sound finishes playing its decay tail or is stopped */
  readonly promise: Promise<void>
}
```

`play()` resolves when the oscillator is scheduled, not when audio ends. To wait for sound completion, await `handle.promise`.

## SoundManager API

### Constructor options

```ts
interface SoundManagerOptions {
  /** Master volume multiplier from 0 to 2. Defaults to 1.0 */
  masterVolume?: number

  /** Custom AudioContext. When omitted, uses the shared singleton context */
  audioContext?: AudioContext

  /** Inserts a brickwall limiter (-3 dBFS threshold) on the master bus. Defaults to false */
  limiter?: boolean
}
```

### Methods and properties

- `register(name, definitionOrSound)`: adds or updates a sound in the registry.
- `registerAll(record)`: registers multiple sounds from an object map. Chainable.
- `unregister(name)`: stops any active playback of the sound and removes it. Returns `true` if removed.
- `get(name)`: returns the `Sound` instance, or `undefined`.
- `has(name)`: returns `true` if registered.
- `play(name, options?)`: plays a registered sound. Returns `Promise<PlaybackHandle | null>` (`null` if unregistered).
- `stopAll()`: immediately stops all playing voices across the registry.
- `clear()`: stops all sounds and empties the registry.
- `dispose()`: clears the registry and disconnects the master audio bus.
- `list()`: returns an array of registered sound names.
- `getAll()`: returns an array of registered `Sound` instances.
- `keys()`, `values()`, `entries()`, `forEach`, `find`, `filter`: standard collection iteration methods.
- `masterVolume`: get or set the master output volume (`0..2`). Adjusts running voices with an anti-zipper glide.
- `outputLevel`: live peak amplitude (`0..1`) exiting the master fader.
- `size`: count of registered sounds.

## Utilities

### Validation

Validate untrusted JSON payloads or user-authored sound definitions:

```ts
import { isValidSoundDefinition, validateSoundDefinition } from '@rjvr/buzzsaw'

if (isValidSoundDefinition(input)) {
  sounds.register('custom', input)
}
else {
  const errors = validateSoundDefinition(input)
  console.error('Invalid sound definition:', errors)
}
```

`validateSoundDefinition` checks property types, ranges, step structures, and protects against prototype pollution.

### Audio inspection

Inspect sound timing and curves without initializing Web Audio nodes:

```ts
import {
  calculateEffectiveDuration,
  cloneSoundDefinition,
  sampleFrequencyAtTime,
  sampleGainAtTime,
} from '@rjvr/buzzsaw'

// Total duration in seconds, including envelope extensions
const totalSeconds = calculateEffectiveDuration(definition)

// Value inspection at specific offsets
const hzAtHalfSecond = sampleFrequencyAtTime(definition, 0.5)
const gainAtHalfSecond = sampleGainAtTime(definition, 0.5, totalSeconds)

// Safe deep copy
const definitionCopy = cloneSoundDefinition(definition)
```

## License

[MIT](LICENSE)
