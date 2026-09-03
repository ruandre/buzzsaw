# Buzzsaw

Sound effects described as data and synthesized in the browser. No audio files, no runtime dependencies.

Instead of shipping megabytes of `.wav` or `.mp3` assets, Buzzsaw describes sounds as small JSON objects and synthesizes them in real time using the Web Audio API. You get instant loading, dynamic pitch and volume scaling, and zero audio asset requests.

Explore the built-in library, inspect waveforms, and audition sounds in the **[Studio](https://ruandre.github.io/buzzsaw/)**.

## Packages

| Package                                       | Description                                                       |
| :-------------------------------------------- | :---------------------------------------------------------------- |
| [`@rjvr/buzzsaw`](packages/core/README.md)    | Web Audio synthesizer, sound registry, and parameter envelopes.   |
| [`@rjvr/buzzsaw-wav`](packages/wav/README.md) | RIFF/WAVE encoder, offline renderer, and file exporter.           |
| [`@rjvr/buzzsaw-app`](app)                    | Web studio with an oscilloscope, synthesizer, and preset library. |

## Quick start

### Synthesis and playback with `@rjvr/buzzsaw`

Install the core library:

```bash
npm install @rjvr/buzzsaw
# or: pnpm add / yarn add / bun add
```

A `SoundManager` starts empty. The 80+ presets live in a separate entrypoint (`@rjvr/buzzsaw/sounds`), so applications with custom sounds never bundle them:

```ts
import { SoundManager } from '@rjvr/buzzsaw'
import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'

const sounds = new SoundManager({ masterVolume: 0.8, limiter: true })
sounds.registerAll(DEFAULT_SOUNDS)

// Schedules playback immediately and returns a handle
const handle = await sounds.play('laserShot', { volume: 0.9, pitchScale: 1.2 })

// Stop early with a click-free fade
handle?.stop()

// Or wait for the decay tail to finish
await handle?.promise
```

Define and play a sound directly without a registry:

```ts
import { Sound } from '@rjvr/buzzsaw'

const laser = new Sound('laser', {
  waveType: 'sawtooth',
  duration: 0.2,
  frequency: {
    start: 1200,
    steps: [{ value: 200, time: 0.15 }],
  },
  gain: 0.4,
})

await laser.play()
```

Browsers block audio playback until the user interacts with the page. Unlock the audio context on the first user gesture:

```ts
import { ensureAudioContextReady } from '@rjvr/buzzsaw'

window.addEventListener('pointerdown', () => ensureAudioContextReady(), { once: true })
```

### WAV export with `@rjvr/buzzsaw-wav`

Install the export library:

```bash
npm install @rjvr/buzzsaw-wav @rjvr/buzzsaw
# or: pnpm add / yarn add / bun add
```

Export a sound definition directly to a browser `.wav` download:

```ts
import { WavExporter } from '@rjvr/buzzsaw-wav'

const definition = {
  waveType: 'triangle',
  duration: 0.25,
  frequency: 880,
  gain: 0.3,
}

// Trigger a browser file download
await WavExporter.downloadWav(definition, 'chime.wav')

// Or render offline to a WAV Blob (8, 16, 24-bit PCM or 32-bit float)
const wavBlob = await WavExporter.renderToWavBlob(definition, {
  bitDepth: 16,
  sampleRate: 44100,
})
```

Offline rendering uses `OfflineAudioContext`, so it runs faster than real time and needs no user gesture or active audio device.

## License

[MIT](LICENSE)
