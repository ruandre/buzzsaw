# @rjvr/buzzsaw-wav

RIFF/WAVE encoder, offline audio renderer, and file exporter for Web Audio and Buzzsaw sound definitions.

Render synthesized sound effects to `.wav` downloads in the browser, or export raw `ArrayBuffer` and `Blob` instances for headless pipelines and storage.

## Installation

`@rjvr/buzzsaw` is a peer dependency, so install both:

```bash
npm install @rjvr/buzzsaw-wav @rjvr/buzzsaw
# or: pnpm add / yarn add / bun add
```

## Quick start

### Trigger a browser download

Pass a `SoundDefinition` or an existing `Blob` directly to `downloadWav`:

```ts
import type { SoundDefinition } from '@rjvr/buzzsaw'
import { WavExporter } from '@rjvr/buzzsaw-wav'

const laser: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 1200,
    steps: [{ value: 120, time: 0.15 }],
  },
  duration: 0.18,
  gain: 0.4,
}

// Renders offline and initiates a browser download: laser.wav
await WavExporter.downloadWav(laser, 'laser.wav')
```

Annotate the definition with `SoundDefinition`. Without it, TypeScript widens `waveType: 'sawtooth'` to `string` and the call fails to compile.

`downloadWav` needs a DOM `document` and throws without one, before it renders anything. Outside the browser, render and write the bytes yourself.

### Render to a Blob or ArrayBuffer

Render sound definitions offline, faster than real time and with no user gesture or audio device:

```ts
import { WavExporter } from '@rjvr/buzzsaw-wav'

// audio/wav Blob for uploads, IndexedDB, or object URLs
const blob = await WavExporter.renderToWavBlob(laser, {
  sampleRate: 44100,
  bitDepth: 16,
})

// ArrayBuffer containing the canonical 44-byte RIFF header and PCM samples
const buffer = await WavExporter.renderToWavArrayBuffer(laser, {
  bitDepth: 24,
})
```

## Node.js

Rendering needs an `OfflineAudioContext`. Node has no global one, so supply an implementation, for example from [`node-web-audio-api`](https://github.com/ircam-ismm/node-web-audio-api):

```bash
npm install node-web-audio-api
```

```ts
import { Buffer } from 'node:buffer'
import { writeFile } from 'node:fs/promises'
import { WavExporter } from '@rjvr/buzzsaw-wav'
import { OfflineAudioContext } from 'node-web-audio-api'

const buffer = await WavExporter.renderToWavArrayBuffer(laser, {
  offlineAudioContextClass: OfflineAudioContext,
  sampleRate: 48000,
  bitDepth: 24,
})

await writeFile('laser.wav', Buffer.from(buffer))
```

Assigning the polyfill to `globalThis.OfflineAudioContext` works too, but the `offlineAudioContextClass` option keeps it local to the call.

The published types declare only the slice of the Web Audio API these packages use, so this compiles under a Node-only `tsconfig` (`"lib": ["es2023"]`) with no `lib.dom` and no `@types/node`. `Blob`-returning methods are typed as `BlobLike`, which resolves to the host's own `Blob` wherever one is declared and to a structural equivalent (`size`, `type`, `arrayBuffer()`, `text()`) where none is. Both packages are ESM-only and need `moduleResolution` set to `bundler`, `node16`, or `nodenext`.

## Features

- **Offline rendering.** Renders faster than real time through `OfflineAudioContext`, with no active output device and no user gesture.
- **Multiple bit depths.** 8-bit unsigned PCM, 16-bit signed PCM, 24-bit signed PCM, and 32-bit IEEE float.
- **Web Audio integration.** Encodes Buzzsaw `SoundDefinition` objects, Web Audio `AudioBuffer` instances, or raw `Float32Array[]` channel arrays.
- **Headless.** Works anywhere an `OfflineAudioContext` implementation is available, including Node (see above). `encodeToBlob` additionally needs a global `Blob`, and `downloadWav` needs a DOM.

## WavExporter API

High-level static methods for rendering and exporting Buzzsaw sound definitions:

### Methods

- `downloadWav(soundOrBlob, optionsOrFilename?)`: renders the definition (or takes an existing Blob) and triggers a browser file download. Throws without a DOM document.
- `renderToWavBlob(definition, options?)`: renders offline and encodes directly to an `audio/wav` `Blob`.
- `renderToWavArrayBuffer(definition, options?)`: renders offline and encodes to a raw `ArrayBuffer`.
- `renderToAudioBuffer(definition, options?)`: renders offline into an audio buffer.

The rendered buffer spans the definition's effective duration, so the decay tail is included. Envelope steps scheduled past `duration` extend it; `attack` and `decay` do not.

### Options

`WavExportOptions` extends `WavEncodingOptions`. Both are flattened here for reference:

```ts
interface WavExportOptions {
  /** Bit depth: 8, 16, 24 integer PCM or 32 IEEE float. Defaults to 16 */
  bitDepth?: 8 | 16 | 24 | 32

  /** Target sample rate in Hz, at least 8000. Defaults to 44100 */
  sampleRate?: number

  /** Channels written to the file. Defaults to the input's channel count, which is 1 for Buzzsaw synthesis */
  numChannels?: number

  /** Download filename. Defaults to 'sound.wav' */
  filename?: string

  /** Pitch multiplier, positive (e.g. 2.0 = octave up). Defaults to 1.0 */
  pitchScale?: number

  /** Volume multiplier, non-negative. Defaults to 1.0 */
  volume?: number

  /** OfflineAudioContext implementation. Defaults to the global one */
  offlineAudioContextClass?: OfflineAudioContextConstructor
}
```

Out-of-range values throw a `RangeError` naming the offending value rather than being silently clamped: a `sampleRate` under 8000, a `numChannels` below 1 or non-integer, a negative `volume`, a `pitchScale` of zero or less, an unsupported `bitDepth`.

### Exported audio is not limited

`SoundManager` inserts a brickwall limiter on its master bus by default; this package renders the definition raw. A definition that plays cleanly through a manager can therefore export hotter than it sounds, and a `volume` above 1 clips outright. Keep `volume` at or below 1, or leave headroom in the definition's `gain`, when the two outputs need to match.

Buzzsaw synthesis is mono. `numChannels: 2` therefore writes the same samples to both channels and doubles the file size. It adds no stereo information, and there is no pan or width parameter.

## OfflineSoundRenderer API

`WavExporter` renders through this class; use it directly to get an audio buffer without encoding one.

- `render(definition, options?)`: renders a definition to an audio buffer spanning its effective duration. Accepts `sampleRate`, `numChannels`, `volume`, `pitchScale`, and `offlineAudioContextClass`.
- `isSupported()`: `true` when a global `OfflineAudioContext` exists. An explicit `offlineAudioContextClass` works regardless.
- `getOfflineAudioContextClass()`: the global implementation, or `null`.

## WavEncoder API

Low-level static methods for encoding raw audio samples into RIFF/WAVE containers:

```ts
import { WavEncoder } from '@rjvr/buzzsaw-wav'

// Encode an audio buffer or Float32Array[] channel array to ArrayBuffer
const arrayBuffer = WavEncoder.encode(audioBuffer, {
  bitDepth: 16,
  sampleRate: 44100,
})

// Encode directly to an audio/wav Blob
const blob = WavEncoder.encodeToBlob(audioBuffer, { bitDepth: 32 })

// Parse header metadata from an ArrayBuffer
const info = WavEncoder.decodeHeader(arrayBuffer)
if (info) {
  console.log(info.sampleRate, info.bitDepth, info.duration)
}
```

### Decoded header info

`WavEncoder.decodeHeader` reads the 44-byte RIFF/WAVE header and returns:

```ts
interface WavHeaderInfo {
  audioFormat: number // 1 for PCM, 3 for IEEE float
  numChannels: number
  sampleRate: number
  byteRate: number
  blockAlign: number
  bitDepth: number
  dataSize: number
  duration: number // duration in seconds
}
```

Returns `null` if the buffer is smaller than 44 bytes or lacks the `RIFF` and `WAVE` magic markers.

### Errors

- `RangeError`: an option outside its documented range, from both `WavEncoder.encode` and `OfflineSoundRenderer.render`.
- `Error`: the environment is missing something the call needs, namely an `OfflineAudioContext` for rendering or a `document` for `downloadWav`. Both messages name what to install or pass.

## For LLMs and coding agents

[llms.txt](https://ruandre.github.io/buzzsaw/llms.txt) condenses this reference into an index of the API and the behavior worth knowing before writing code.

## License

[MIT](LICENSE)
