# @rjvr/buzzsaw

Zero-dependency Web Audio synthesizer, sound registry, and parameter automation library for TypeScript and JavaScript.

Instead of loading static audio files over the network, define sound effects as small JSON data objects. Buzzsaw synthesizes them on demand using Web Audio oscillators and gain envelopes.

## Installation

```bash
npm install @rjvr/buzzsaw
# or: pnpm add / yarn add / bun add
```

The package is ESM-only and has no runtime dependencies. Its published types declare only the slice of the Web Audio API it uses, so it typechecks under a Node-only `tsconfig` (`"lib": ["es2023"]`). Set `moduleResolution` to `bundler`, `node16`, or `nodenext`; the legacy `node10` setting cannot read the `exports` map and will not find the presets subpath (TypeScript 7 removed it outright). Running outside the browser needs a polyfill such as [`node-web-audio-api`](https://github.com/ircam-ismm/node-web-audio-api).

The 113 built-in presets live in a separate subpath (`@rjvr/buzzsaw/sounds`). Import them individually to bundle only what you use: five presets cost ~0.3 kB gzip on top of the library, all 113 cost ~5.4 kB.

## Quick start

### Play a single sound

Use `Sound` to define and play an isolated sound effect:

```ts
import type { SoundDefinition } from '@rjvr/buzzsaw'
import { Sound } from '@rjvr/buzzsaw'

const laserDefinition: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 1200,
    steps: [{ value: 200, time: 0.15 }],
  },
  gain: 0.4,
  duration: 0.2,
}

const laser = new Sound('laser', laserDefinition)

// Play immediately using the shared AudioContext
const handle = await laser.play()

// Stop before the sound finishes (ramps down smoothly without clicks)
handle.stop()

// Or wait until playback finishes
await handle.promise
```

Annotate definitions with `SoundDefinition` (or use `satisfies SoundDefinition`). Without it, TypeScript widens `waveType: 'sawtooth'` to `string` and the object no longer matches.

### Manage sound collections

`SoundManager` groups sounds under a shared master volume, limiter, and audio context. `register` and `registerAll` return the manager, so chaining both registers the sounds and teaches `play` their names:

```ts
import { SoundManager } from '@rjvr/buzzsaw'
import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'

const sounds = new SoundManager({ masterVolume: 0.8 })
  .registerAll(DEFAULT_SOUNDS)
  .register('coin', {
    waveType: 'square',
    frequency: {
      start: 987,
      steps: [{ value: 1318, time: 0.08 }],
    },
    duration: 0.3,
    gain: 0.3,
  })

// Autocompletes over every registered name; a typo fails to compile
const handle = await sounds.play('coin', { volume: 0.9, pitchScale: 1.2 })

// Retrieve the stored Sound instance by name
const coin = sounds.get('coin')
```

Where names are only known at runtime, opt out with `new SoundManager<string>()`.

### Node and other non-browser hosts

There is no global `AudioContext` outside the browser. Install a polyfill and hand Buzzsaw its context once at startup; everything else works unchanged:

```ts
import { setAudioContextInstance, SoundManager } from '@rjvr/buzzsaw'
import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'
import { AudioContext } from 'node-web-audio-api'

setAudioContextInstance(new AudioContext())

const sounds = new SoundManager().registerAll(DEFAULT_SOUNDS)
await sounds.play('coinCollect')
```

To render to a file instead of a device, use [`@rjvr/buzzsaw-wav`](https://github.com/ruandre/buzzsaw/tree/main/packages/wav#readme), which needs no shared context.

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

  /** Harmonic amplitudes. Required when waveType is 'custom', ignored otherwise. Up to 64 partials */
  partials?: number[]

  /** Base pitch in Hz, above 0 and at most 20000, or an envelope contour over time */
  frequency: number | EnvelopeDefinition

  /**
   * Peak amplitude from 0 to 1, or an envelope contour; above 1 is an error, not clipping;
   * 0 renders as 0.0001, the silence floor an exponential ramp cannot cross. Defaults to 0.5
   */
  gain?: number | EnvelopeDefinition

  /** Total playback length in seconds, at least 0.01, inclusive of attack and decay. Defaults to 0.5 */
  duration?: number

  /** Attack ramp-in in seconds, carved out of duration. Defaults to 0.005 */
  attack?: number

  /** Decay ramp-out in seconds, carved out of duration. Defaults to 0.1 */
  decay?: number
}
```

There is no noise source. Every voice is a single oscillator, so you approximate noisy textures with harmonics (`waveType: 'custom'` with dense `partials`). Presets like `rustle` and `staticBurst` do exactly that.

Definitions are validated when a `Sound` is constructed or registered. A malformed one throws `SoundValidationError`, whose `errors` array lists every problem found. Validation is strict in both directions: a value outside a documented range is rejected rather than clamped (`gain: 5` and `frequency: 30000` are errors, not quiet clipping and silence), and an unrecognized property is an error rather than being dropped, so `waveform` instead of `waveType` fails loudly. Definitions carry no metadata, so keep your own names and descriptions beside one, not inside it.

### How duration, attack, and decay interact

`duration` is the total length of the voice. `attack` and `decay` are windows **carved out of** it, not added to it:

```ts
// Plays for 0.2s total: ~0.005s attack, steady, then a decay that starts at 0.1s
calculateEffectiveDuration({ frequency: 440, duration: 0.2, decay: 0.1 }) // 0.2

// A decay longer than the duration is clamped, not accommodated
calculateEffectiveDuration({ frequency: 440, duration: 0.2, decay: 0.5 }) // 0.2
```

Only one thing extends a sound: an envelope step scheduled past `duration`. The voice then runs to that step plus a 10 ms tail:

```ts
calculateEffectiveDuration({
  frequency: { start: 440, steps: [{ value: 880, time: 2 }] },
  duration: 0.2,
}) // 2.01
```

`Sound.duration` and the offline renderer both report this effective length.

The attack ramps up linearly from a 0.0001 silence floor, and the decay ramps back down to it exponentially. Both apply whether `gain` is a number or an envelope. With an envelope, the attack ramps in to the envelope's `start` value, and yields early if a step is authored before the attack would end.

An attack long enough to swallow the whole duration is clamped to leave a 1 ms decay window, so a voice always fades instead of cutting off at full amplitude.

### Envelopes

Both `frequency` and `gain` accept automation envelopes:

```ts
interface EnvelopeDefinition {
  /** Initial value at time 0 */
  start: number
  /** Automation targets, in any order. `time` is an offset in seconds from sound start, never negative */
  steps: { value: number, time: number }[]
  /** Defaults to 'linear' for frequency, 'step' for gain */
  interpolation?: 'linear' | 'step'
}
```

The two fields have **different defaults**, which is easy to miss:

- A frequency envelope **glides** between steps (linear ramps), so it reads as a pitch slide.
- A gain envelope **holds** each value until the next step (a staircase), then ramps exponentially to silence during the decay window.

Set `interpolation` explicitly to override either default: `interpolation: 'linear'` on a gain envelope gives a smooth fade, `interpolation: 'step'` on a frequency envelope gives discrete pitch jumps.

```ts
const powerDown: SoundDefinition = {
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
    interpolation: 'linear',
    steps: [
      { value: 0.3, time: 0.3 },
      { value: 0.1, time: 0.5 },
    ],
  },
  duration: 0.6,
  decay: 0.15,
}
```

## Playback handles

Calling `play()` on a `Sound` or `SoundManager` schedules the voice immediately and returns a `PlaybackHandle`:

```ts
interface PlaybackHandle {
  /** Immediately stops playback with a 5 ms linear fade to prevent clicks */
  stop: () => void

  /** True while the voice is actively scheduled or rendering */
  readonly isPlaying: boolean

  /** Resolves when the sound finishes playing its decay tail or is stopped */
  readonly promise: Promise<void>
}
```

`play()` resolves when the oscillator is scheduled, not when audio ends. To wait for the sound itself, await `handle.promise`:

```ts
const handle = await sounds.play('coin')
await handle?.promise
```

## SoundManager API

### Constructor options

```ts
interface SoundManagerOptions {
  /** Master volume multiplier from 0 to 2. Defaults to 1.0 */
  masterVolume?: number

  /** Custom AudioContext. When omitted, uses the shared singleton context */
  audioContext?: AudioContextLike

  /** Inserts a brickwall limiter (-3 dBFS threshold) on the master bus. Defaults to true */
  limiter?: boolean

  /** Called when play() is given an unregistered name. Defaults to logging an error */
  onMissing?: (name: string) => void
}
```

Out-of-range values throw rather than clamp: `masterVolume` outside `0..2`, a negative `volume`, or a `pitchScale` of zero or less all raise a `RangeError` naming the offending value.

Pass your own `onMissing` to silence the default log for unregistered names, which is worth doing if you play sounds on hover:

```ts
const sounds = new SoundManager({ onMissing: () => {} }).registerAll(DEFAULT_SOUNDS)
```

`register` and `registerAll` return a manager widened over the names just added. They do not widen the variable you called them on, so chain them onto the constructor. Registering as a separate statement leaves `play` accepting nothing:

```ts
const separate = new SoundManager()
separate.registerAll(DEFAULT_SOUNDS) // the widened manager is discarded
separate.play('click')
// Argument of type '"click"' is not assignable to parameter of type
// '"no sounds registered; chain .register() or .registerAll() onto the constructor"'

const chained = new SoundManager().registerAll(DEFAULT_SOUNDS) // play accepts all 113 names
```

### Methods and properties

- `register(name, definitionOrSound)`: adds or updates one sound. Returns the manager, widened so `play` accepts `name`. Throws `SoundValidationError` on a malformed definition.
- `registerAll(record)`: same, for an object map of sounds.
- `unregister(name)`: stops any active playback of the sound and removes it. Returns `true` if removed.
- `get(name)`: returns the `Sound` instance, or `undefined`.
- `has(name)`: returns `true` if registered.
- `play(name, options?)`: plays through the master bus. Returns `Promise<PlaybackHandle | null>` (`null` if unregistered). Options are `volume` and `pitchScale`; routing belongs to the manager, so use `Sound.play` if you need a custom `destination`.
- `stopAll()`: immediately stops all playing voices across the registry.
- `clear()`: stops all sounds and empties the registry.
- `dispose()`: clears the registry and disconnects the master audio bus.
- `list()`: returns an array of registered sound names, typed as the names `play` accepts.
- `getAll()`: returns an array of registered `Sound` instances.
- `keys()`, `values()`, `entries()`, `forEach()`, `find()`, `filter()`: standard collection iteration methods. Every name they yield is typed as a `play` argument, so iterating the registry and playing what it hands back typechecks without a cast.
- `masterVolume`: get or set the master output volume (`0..2`). Adjusts running voices with an anti-zipper glide.
- `outputLevel`: peak amplitude (`0..1`) leaving the master fader over the last analysis window. Reads `0` until the first `play()` call builds the bus, and on contexts with no analyser node.
- `size`: count of registered sounds.

## Preset library

113 presets ship in `@rjvr/buzzsaw/sounds`, each exported both individually and through the `DEFAULT_SOUNDS` map. Audition them in the [Studio](https://ruandre.github.io/buzzsaw/).

```ts
// Bundles only these two
import { click, coinCollect } from '@rjvr/buzzsaw/sounds'
```

```ts
// Bundles all 113
import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'
```

`DefaultSoundName` is exported as a union of every preset name.

| Category         | Count | Presets                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| :--------------- | ----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI & Clicks      |    16 | `backSwipe`, `bubblePop`, `click`, `collapse`, `confirmationTick`, `delicatePluck`, `drop`, `expand`, `knockTap`, `mechanicalClick`, `metallicClink`, `pop`, `quickSwipe`, `tap`, `toggle`, `waterDrop`                                                                                                                                                                                                                                                          |
| Notifications    |    16 | `chime`, `confirm`, `ding`, `flourish`, `gentleLoading`, `infoBlip`, `jingle`, `messageReceived`, `messageSent`, `mysticChime`, `notification`, `ping`, `shimmerBell`, `successArpeggio`, `successChime`, `zapBlip`                                                                                                                                                                                                                                              |
| Alerts & Alarms  |    32 | `airRaidSiren`, `airyPulse`, `alarm`, `broadcastAlert`, `buzz`, `criticalError`, `deny`, `digitalError`, `dispatchTone`, `distortedAlert`, `electronicAlarm`, `errorBuzz`, `evacuationT3`, `failArpeggio`, `flatlineTone`, `highPriorityPulse`, `horn`, `hornBlast`, `intenseWarning`, `klaxon`, `monitorPulse`, `pulse`, `sharpWarning`, `siren`, `sirenHiLo`, `sirenWail`, `sirenYelp`, `subtleError`, `systemFailure`, `tonalAlert`, `urgentAlert`, `warning` |
| Sci-Fi & FX      |    12 | `cosmicHum`, `cosmicSweep`, `engineHum`, `glitchZap`, `laserShot`, `pixelJump`, `powerDown`, `powerUp`, `roboticBeep`, `spaceAmbience`, `teleportBeam`, `warpJump`                                                                                                                                                                                                                                                                                               |
| Game             |     8 | `arcadeLevelUp`, `bossStomp`, `coinCollect`, `gameOverFall`, `heavyStrike`, `questComplete`, `question`, `shieldRecharge`                                                                                                                                                                                                                                                                                                                                        |
| Musical          |     4 | `arpeggioMajorSeventh`, `bassGroove`, `chordStabMinor`, `melodyMotif`                                                                                                                                                                                                                                                                                                                                                                                            |
| Tones & Textures |    25 | `airySweep`, `digitalChirp`, `faintShimmer`, `fallingTone`, `focusShift`, `gentleRise`, `gentleSweep`, `grind`, `heavyThump`, `impact`, `ripple`, `risingTone`, `rustle`, `scanner`, `simpleBeep`, `smoothWhoosh`, `softFlutter`, `staticBurst`, `subtleHover`, `subtleHum`, `taskComplete`, `thud`, `thunk`, `twinkleTrail`, `undoAction`                                                                                                                       |

## Utilities

### Validation

`register` and the `Sound` constructor validate for you and throw `SoundValidationError`. Validate explicitly when you would rather collect the problems than catch an exception, as with untrusted JSON or user-authored definitions:

```ts
import { isValidSoundDefinition, validateSoundDefinition } from '@rjvr/buzzsaw'

if (isValidSoundDefinition(input)) {
  sounds.register('custom', input)
}
else {
  console.error('Invalid sound definition:', validateSoundDefinition(input))
}
```

`validateSoundDefinition` returns an array of messages, empty when valid, checking property names, types, ranges, and step structures.

### Inspection

Inspect sound timing and curves without creating Web Audio nodes. These functions drive the waveform previews. They mirror the ramps that playback schedules, so a sampled gain matches what you hear:

```ts
import {
  calculateEffectiveDuration,
  cloneSoundDefinition,
  evaluateWaveShape,
  resolvePartials,
  sampleFrequencyAtTime,
  sampleGainAtTime,
} from '@rjvr/buzzsaw'

// Total duration in seconds, including any envelope extension
const totalSeconds = calculateEffectiveDuration(definition)

// Parameter values at a given offset
const hzAtHalfSecond = sampleFrequencyAtTime(definition, 0.5)
const gainAtHalfSecond = sampleGainAtTime(definition, 0.5, totalSeconds)

// Normalized amplitude [-1, 1] at a phase in radians
const amplitude = evaluateWaveShape(definition, Math.PI / 2)

// Harmonic amplitudes for a 'custom' waveType, or null
const partials = resolvePartials(definition)

// Editable deep copy; Sound.definition itself is deeply frozen
const editable = cloneSoundDefinition(sound.definition)
```

### Smaller exports

These exist because the Studio needs them. They are stable, but reach for them only when the higher-level API does not cover you:

- `clamp(value, min, max)` and `round(value, decimals)`: the numeric helpers used to keep edited definitions in range. Handy when building an editor over `SoundDefinition`, and nothing more than they look like.
- `isEnvelope(value)`: narrows a `frequency` or `gain` to `EnvelopeDefinition`.
- `freezeSoundDefinition(def)`: deep-freezes a definition in place, including its envelope steps. `Sound` applies this to what it holds.
- `resolveEnvelopeTiming(def, duration)`: the resolved `attack`, `decay`, and `decayStartTime` in seconds, after clamping. This is how a preview draws the phase boundaries playback will use.
- `AudioBus`: the master output stage a `SoundManager` builds, should you want to construct one yourself. `input`, `setVolume(volume, atTime)`, `readPeakLevel()`, and `dispose()`.

### Playing without a Sound or a manager

`playSoundFromDefinition(audioContext, definition, options?)` schedules a definition straight onto a context you own and returns a `PlaybackHandle`. `Sound.play` and `SoundManager.play` are built on it.

It is the one entry point that does **not** validate: validation happens when a `Sound` is constructed or registered, so a definition reaching this function directly is trusted and missing or malformed fields fall back to defaults instead of throwing. Call `validateSoundDefinition` first for anything you did not write.

### Errors

- `SoundValidationError` (with an `errors` string array): a malformed definition, from the `Sound` constructor, `setDefinition`, `register`, or `registerAll`.
- `TypeError`: an argument of the wrong shape, such as an empty sound name or a non-object definition.
- `RangeError`: a well-typed option outside its documented range, such as `masterVolume`, `volume`, or `pitchScale`.

`Sound.play` and `SoundManager.play` are async, and they **reject** when no `AudioContext` can be created or resumed. That happens outside the browser, and after `closeAudioContext()`. Guard with `isAudioContextSupported()`, supply a context with `setAudioContextInstance()`, or catch the rejection.

### Audio context

The shared `AudioContext` is created lazily on first playback.

- `ensureAudioContextReady()`: creates or resumes it.
- `getAudioContextInstance()`: returns it, or `null` where Web Audio is unavailable. It never logs, so reading it during server-side rendering is safe.
- `isAudioContextSupported()`: reports availability.
- `closeAudioContext()`: closes and clears it.
- `setAudioContextInstance(ctx)`: replaces it with one you own, without closing whatever it displaces. This is how a Node polyfill's context is supplied.
- `getAudioContextClass()`: returns the constructor Buzzsaw would use, or `null` where Web Audio is unavailable.

## For LLMs and coding agents

[llms.txt](https://ruandre.github.io/buzzsaw/llms.txt) condenses this reference into an index of the API and the behavior worth knowing before writing code.

## License

[MIT](LICENSE)
