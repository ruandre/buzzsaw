# Buzzsaw

Sound effects described as data and synthesized in the browser. No audio files, and the synthesizer has no dependencies.

Instead of shipping megabytes of `.wav` or `.mp3` assets, Buzzsaw describes sounds as small JSON objects and synthesizes them in real time using the Web Audio API. Nothing to download and nothing to wait for. Pitch and volume scale at playback time.

Audition the presets and inspect their waveforms in the **[Studio](https://ruandre.github.io/buzzsaw/)**.

Point an LLM or coding agent at **[llms.txt](https://ruandre.github.io/buzzsaw/llms.txt)**, which indexes the API and the behavior that is easiest to guess wrong.

## Packages

| Package                                                                                 | Description                                                     |
| :-------------------------------------------------------------------------------------- | :-------------------------------------------------------------- |
| [`@rjvr/buzzsaw`](https://github.com/ruandre/buzzsaw/tree/main/packages/core#readme)    | Web Audio synthesizer, sound registry, and parameter envelopes. |
| [`@rjvr/buzzsaw-wav`](https://github.com/ruandre/buzzsaw/tree/main/packages/wav#readme) | RIFF/WAVE encoder, offline renderer, and file exporter.         |
| [`@rjvr/buzzsaw-app`](https://github.com/ruandre/buzzsaw/tree/main/app#readme)          | Studio with an oscilloscope, synthesizer, and preset library.   |

## Quick start

### Synthesis and playback with `@rjvr/buzzsaw`

Install the core library:

```bash
npm install @rjvr/buzzsaw
# or: pnpm add / yarn add / bun add
```

Both packages are ESM-only, and their published types need `moduleResolution` set to `bundler`, `node16`, or `nodenext`.

A `SoundManager` starts empty. The 113 presets live in a separate entrypoint (`@rjvr/buzzsaw/sounds`):

```ts
import { SoundManager } from '@rjvr/buzzsaw'
import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'
// Every preset is also a named export, so importing them one at a time bundles only those:
// import { click, laserShot } from '@rjvr/buzzsaw/sounds'

// register/registerAll return the manager, and teach play() the registered names
const sounds = new SoundManager({ masterVolume: 0.8 }).registerAll(DEFAULT_SOUNDS)
// const sounds = new SoundManager({ masterVolume: 0.8 }).registerAll({ click, laserShot })

// Schedules playback immediately and returns a handle
const handle = await sounds.play('laserShot', { volume: 0.9, pitchScale: 1.2 })

// Stop early with a click-free fade
handle?.stop()

// Or wait for the decay tail to finish
await handle?.promise
```

Define and play a sound directly without a registry:

```ts
import type { SoundDefinition } from '@rjvr/buzzsaw'
import { Sound } from '@rjvr/buzzsaw'

const definition: SoundDefinition = {
  waveType: 'sawtooth',
  duration: 0.2,
  frequency: {
    start: 1200,
    steps: [{ value: 200, time: 0.15 }],
  },
  gain: 0.4,
}

await new Sound('laser', definition).play()
```

Annotate definitions with `SoundDefinition` (or `satisfies SoundDefinition`). Without it, TypeScript widens `waveType: 'sawtooth'` to `string` and the object no longer matches.

Browsers block audio playback until the user interacts with the page. Unlock the audio context on the first user gesture:

```ts
import { ensureAudioContextReady } from '@rjvr/buzzsaw'

window.addEventListener('pointerdown', () => ensureAudioContextReady(), { once: true })
```

### WAV export with `@rjvr/buzzsaw-wav`

`@rjvr/buzzsaw` is a peer dependency of the export library, so install both:

```bash
npm install @rjvr/buzzsaw-wav @rjvr/buzzsaw
# or: pnpm add / yarn add / bun add
```

Export a sound definition directly to a browser `.wav` download:

```ts
import { WavExporter } from '@rjvr/buzzsaw-wav'

// Trigger a browser file download
await WavExporter.downloadWav(definition, 'laser.wav')

// Or render offline to a WAV Blob (8, 16, 24-bit PCM or 32-bit float)
const wavBlob = await WavExporter.renderToWavBlob(definition, {
  bitDepth: 16,
  sampleRate: 44100,
})
```

Offline rendering uses `OfflineAudioContext`, so it runs faster than real time and needs no user gesture or active audio device. Node has no global `OfflineAudioContext`; pass one via the `offlineAudioContextClass` option. See the [WAV package README](https://github.com/ruandre/buzzsaw/tree/main/packages/wav#nodejs).

## License

[MIT](LICENSE)
