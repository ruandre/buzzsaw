import type { AudioBufferLike } from '@rjvr/buzzsaw'
import type { BlobLike, WavBitDepth, WavEncodingOptions, WavHeaderInfo } from './types.js'
import { DEFAULT_SAMPLE_RATE, requireBitDepth, requireChannelCount, requireSampleRate } from './options.js'

const HEADER_BYTES = 44

const FORMAT_PCM = 1
const FORMAT_IEEE_FLOAT = 3

/** Writes clamped [-1, 1] sample at offset; returns bytes written */
type SampleWriter = (view: DataView, offset: number, sample: number) => number

const SAMPLE_WRITERS: Record<WavBitDepth, SampleWriter> = {
  8: (view, offset, sample) => {
    // 8-bit WAV PCM is unsigned, centered on 128
    view.setUint8(offset, clamp(Math.floor((sample + 1) * 127.5), 0, 255))
    return 1
  },
  16: (view, offset, sample) => {
    view.setInt16(offset, toSignedInt(sample, 0x8000, 0x7FFF), true)
    return 2
  },
  24: (view, offset, sample) => {
    const value = toSignedInt(sample, 0x800000, 0x7FFFFF)
    view.setUint8(offset, value & 0xFF)
    view.setUint8(offset + 1, (value >> 8) & 0xFF)
    view.setUint8(offset + 2, (value >> 16) & 0xFF)
    return 3
  },
  32: (view, offset, sample) => {
    view.setFloat32(offset, sample, true)
    return 4
  },
}

export class WavEncoder {
  /** Encodes samples to RIFF/WAVE ArrayBuffer; throws RangeError on an out-of-range option */
  static encode(
    audioBufferOrChannels: AudioBufferLike | Float32Array[],
    options: WavEncodingOptions = {},
  ): ArrayBuffer {
    const source = readSource(audioBufferOrChannels, requireSampleRate(options.sampleRate))
    const numChannels = requireChannelCount(options.numChannels, source.channels.length || 1)
    const bitDepth = requireBitDepth(options.bitDepth)
    const writeSample = SAMPLE_WRITERS[bitDepth]

    const blockAlign = numChannels * (bitDepth / 8)
    const dataSize = source.numSamples * blockAlign
    const arrayBuffer = new ArrayBuffer(HEADER_BYTES + dataSize)
    const view = new DataView(arrayBuffer)

    writeHeader(view, {
      sampleRate: source.sampleRate,
      numChannels,
      bitDepth,
      blockAlign,
      dataSize,
    })

    let offset = HEADER_BYTES
    for (let frame = 0; frame < source.numSamples; frame++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const data = source.channels[channel] ?? source.channels[0]
        offset += writeSample(view, offset, normalizeSample(data?.[frame]))
      }
    }

    return arrayBuffer
  }

  static encodeToBlob(
    audioBufferOrChannels: AudioBufferLike | Float32Array[],
    options: WavEncodingOptions = {},
  ): BlobLike {
    return new Blob([this.encode(audioBufferOrChannels, options)], { type: 'audio/wav' })
  }

  /** Decodes RIFF/WAVE header; returns null if invalid or truncated */
  static decodeHeader(arrayBuffer: ArrayBuffer): WavHeaderInfo | null {
    if (arrayBuffer.byteLength < HEADER_BYTES) {
      return null
    }

    const view = new DataView(arrayBuffer)
    if (readAscii(view, 0, 4) !== 'RIFF' || readAscii(view, 8, 4) !== 'WAVE') {
      return null
    }

    const byteRate = view.getUint32(28, true)
    const dataSize = view.getUint32(40, true)

    return {
      audioFormat: view.getUint16(20, true),
      numChannels: view.getUint16(22, true),
      sampleRate: view.getUint32(24, true),
      byteRate,
      blockAlign: view.getUint16(32, true),
      bitDepth: view.getUint16(34, true),
      dataSize,
      duration: byteRate > 0 ? dataSize / byteRate : 0,
    }
  }
}

interface SampleSource {
  channels: Float32Array[]
  sampleRate: number
  numSamples: number
}

function readSource(
  input: AudioBufferLike | Float32Array[],
  sampleRateOverride?: number,
): SampleSource {
  if (isAudioBuffer(input)) {
    const channels = Array.from(
      { length: input.numberOfChannels },
      (_, index) => input.getChannelData(index),
    )
    return {
      channels,
      sampleRate: sampleRateOverride ?? input.sampleRate,
      numSamples: input.length,
    }
  }

  return {
    channels: input,
    sampleRate: sampleRateOverride ?? DEFAULT_SAMPLE_RATE,
    numSamples: input[0]?.length ?? 0,
  }
}

function isAudioBuffer(input: AudioBufferLike | Float32Array[]): input is AudioBufferLike {
  return 'numberOfChannels' in input && typeof input.getChannelData === 'function'
}

interface HeaderFields {
  sampleRate: number
  numChannels: number
  bitDepth: WavBitDepth
  blockAlign: number
  dataSize: number
}

function writeHeader(view: DataView, fields: HeaderFields): void {
  const { sampleRate, numChannels, bitDepth, blockAlign, dataSize } = fields

  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeAscii(view, 8, 'WAVE')

  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, bitDepth === 32 ? FORMAT_IEEE_FLOAT : FORMAT_PCM, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)

  writeAscii(view, 36, 'data')
  view.setUint32(40, dataSize, true)
}

function normalizeSample(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, -1, 1) : 0
}

// Maps [-1, 1] onto asymmetric signed integer range for target bit depth
function toSignedInt(sample: number, negativeScale: number, positiveScale: number): number {
  const scaled = sample < 0 ? Math.floor(sample * negativeScale) : Math.floor(sample * positiveScale)
  return clamp(scaled, -negativeScale, positiveScale)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i))
  }
}

function readAscii(view: DataView, offset: number, length: number): string {
  let text = ''
  for (let i = 0; i < length; i++) {
    text += String.fromCharCode(view.getUint8(offset + i))
  }
  return text
}
