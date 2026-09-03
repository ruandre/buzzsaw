# @rjvr/buzzsaw-wav

RIFF/WAVE encoder, offline audio renderer, and file exporter for Web Audio and Buzzsaw sound definitions.

Render synthesized sound effects directly to `.wav` downloads in the browser, or export raw `ArrayBuffer` and `Blob` instances for headless pipelines and storage.

## Installation

```bash
npm install @rjvr/buzzsaw-wav @rjvr/buzzsaw
# or: pnpm add / yarn add / bun add
```

## Quick start

### Trigger a browser download

Pass a `SoundDefinition` or an existing `Blob` directly to `downloadWav`:

```ts
import { WavExporter } from '@rjvr/buzzsaw-wav'

const laser = {
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

### Render to a Blob or ArrayBuffer

Render sound definitions offline without user interaction or audio hardware:

```ts
import { WavExporter } from '@rjvr/buzzsaw-wav'

// Generates an audio/wav Blob for uploads, IndexedDB, or Object URLs
const blob = await WavExporter.renderToWavBlob(laser, {
  sampleRate: 44100,
  bitDepth: 16,
})

// Generates an ArrayBuffer containing the canonical 44-byte RIFF header and PCM samples
const buffer = await WavExporter.renderToWavArrayBuffer(laser, {
  bitDepth: 24,
})
```

## Features

- **Offline rendering.** Uses `OfflineAudioContext` to render faster than real time. Does not require an active audio output device or a user gesture.
- **Multiple bit depths.** Supports 8-bit unsigned PCM, 16-bit signed PCM, 24-bit signed PCM, and 32-bit IEEE float.
- **Web Audio integration.** Encodes Buzzsaw `SoundDefinition` objects, Web Audio `AudioBuffer` instances, or raw `Float32Array[]` channel arrays.
- **Headless support.** Audio rendering and encoding run in any JavaScript environment where `OfflineAudioContext` exists.

## WavExporter API

High-level static methods for rendering and exporting Buzzsaw sound definitions:

### Methods

- `downloadWav(soundOrBlob, optionsOrFilename?)`: renders the definition (or takes an existing Blob) and triggers a browser file download. Requires a DOM document.
- `renderToWavBlob(definition, options?)`: renders offline and encodes directly to an `audio/wav` `Blob`.
- `renderToWavArrayBuffer(definition, options?)`: renders offline and encodes to a raw `ArrayBuffer`.
- `renderToAudioBuffer(definition, options?)`: renders offline into a Web Audio `AudioBuffer`.

### Options

`WavExportOptions` extends `WavEncodingOptions`:

```ts
interface WavExportOptions {
  /** Bit depth: 8, 16, 24 integer PCM or 32 IEEE float. Defaults to 16 */
  bitDepth?: 8 | 16 | 24 | 32

  /** Target sample rate in Hz. Defaults to 44100 */
  sampleRate?: number

  /** Number of channels (1=mono, 2=stereo). Defaults to 1 */
  numChannels?: number

  /** Download filename. Defaults to 'sound.wav' */
  filename?: string

  /** Pitch multiplier applied during rendering (e.g. 2.0 = octave up) */
  pitchScale?: number

  /** Volume multiplier applied during offline rendering */
  volume?: number
}
```

## WavEncoder API

Low-level static methods for encoding raw audio samples into RIFF/WAVE containers:

```ts
import { WavEncoder } from '@rjvr/buzzsaw-wav'

// Encode an AudioBuffer or Float32Array[] channel array to ArrayBuffer
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

## License

[MIT](LICENSE)
