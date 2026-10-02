import type { AudioBufferLike } from '@rjvr/buzzsaw'
import type { BlobLike, WavBitDepth, WavEncodingOptions, WavHeaderInfo } from './types.js'
import { DEFAULT_SAMPLE_RATE, requireBitDepth, requireChannelCount, requireSampleRate } from './options.js'

const RIFF_PREAMBLE_BYTES = 12
const CHUNK_HEADER_BYTES = 8
const PCM_FMT_BYTES = 16
// Non-PCM formats extend fmt with a 2-byte cbSize and require a fact chunk holding the frame count
const FLOAT_FMT_BYTES = 18
const FACT_CHUNK_BYTES = CHUNK_HEADER_BYTES + 4

const FORMAT_PCM = 1
const FORMAT_IEEE_FLOAT = 3

/** Writes clamped [-1, 1] sample at offset; returns bytes written */
type SampleWriter = (view: DataView, offset: number, sample: number) => number

const SAMPLE_WRITERS: Record<WavBitDepth, SampleWriter> = {
  8: (view, offset, sample) => {
    // 8-bit WAV PCM is unsigned, centered on 128
    view.setUint8(offset, clamp(Math.round((sample + 1) * 127.5), 0, 255))
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
    const sampleRateOverride = options.sampleRate === undefined ? undefined : requireSampleRate(options.sampleRate)
    const source = readSource(audioBufferOrChannels, sampleRateOverride)
    const numChannels = requireChannelCount(options.numChannels, source.channels.length || 1)
    const bitDepth = requireBitDepth(options.bitDepth)
    const writeSample = SAMPLE_WRITERS[bitDepth]

    const blockAlign = numChannels * (bitDepth / 8)
    const dataSize = source.numSamples * blockAlign
    // RIFF chunks are word-aligned; an odd-sized chunk is followed by one zero pad byte
    const padBytes = dataSize % 2
    const arrayBuffer = new ArrayBuffer(headerBytes(bitDepth) + dataSize + padBytes)
    const view = new DataView(arrayBuffer)

    let offset = writeHeader(view, {
      sampleRate: source.sampleRate,
      numChannels,
      bitDepth,
      blockAlign,
      dataSize,
      numSamples: source.numSamples,
    })
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

  /** Decodes the fmt and data chunks of a RIFF/WAVE buffer, skipping others; returns null if invalid or truncated */
  static decodeHeader(arrayBuffer: ArrayBuffer): WavHeaderInfo | null {
    if (arrayBuffer.byteLength < RIFF_PREAMBLE_BYTES) {
      return null
    }

    const view = new DataView(arrayBuffer)
    if (readAscii(view, 0, 4) !== 'RIFF' || readAscii(view, 8, 4) !== 'WAVE') {
      return null
    }

    const chunks = locateChunks(view)
    const fmt = chunks.get('fmt ')
    const data = chunks.get('data')
    if (!fmt || !data || fmt.size < PCM_FMT_BYTES || fmt.offset + PCM_FMT_BYTES > view.byteLength) {
      return null
    }

    const byteRate = view.getUint32(fmt.offset + 8, true)

    return {
      audioFormat: view.getUint16(fmt.offset, true),
      numChannels: view.getUint16(fmt.offset + 2, true),
      sampleRate: view.getUint32(fmt.offset + 4, true),
      byteRate,
      blockAlign: view.getUint16(fmt.offset + 12, true),
      bitDepth: view.getUint16(fmt.offset + 14, true),
      dataSize: data.size,
      duration: byteRate > 0 ? data.size / byteRate : 0,
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
  numSamples: number
}

interface ChunkLocation {
  /** Byte offset of the chunk's payload */
  offset: number
  size: number
}

function isFloat(bitDepth: WavBitDepth): boolean {
  return bitDepth === 32
}

// 44 bytes for PCM, 58 for IEEE float
function headerBytes(bitDepth: WavBitDepth): number {
  return isFloat(bitDepth)
    ? RIFF_PREAMBLE_BYTES + CHUNK_HEADER_BYTES + FLOAT_FMT_BYTES + FACT_CHUNK_BYTES + CHUNK_HEADER_BYTES
    : RIFF_PREAMBLE_BYTES + CHUNK_HEADER_BYTES + PCM_FMT_BYTES + CHUNK_HEADER_BYTES
}

/** Returns the offset where sample data begins */
function writeHeader(view: DataView, fields: HeaderFields): number {
  const { sampleRate, numChannels, bitDepth, blockAlign, dataSize, numSamples } = fields
  const float = isFloat(bitDepth)

  // RIFF size spans everything after its own 8-byte header, pad byte included
  let offset = writeChunkHeader(view, 0, 'RIFF', view.byteLength - CHUNK_HEADER_BYTES)
  writeAscii(view, offset, 'WAVE')
  offset += 4

  offset = writeChunkHeader(view, offset, 'fmt ', float ? FLOAT_FMT_BYTES : PCM_FMT_BYTES)
  view.setUint16(offset, float ? FORMAT_IEEE_FLOAT : FORMAT_PCM, true)
  view.setUint16(offset + 2, numChannels, true)
  view.setUint32(offset + 4, sampleRate, true)
  view.setUint32(offset + 8, sampleRate * blockAlign, true)
  view.setUint16(offset + 12, blockAlign, true)
  view.setUint16(offset + 14, bitDepth, true)
  offset += PCM_FMT_BYTES

  if (float) {
    // cbSize: no format extension follows
    view.setUint16(offset, 0, true)
    offset += FLOAT_FMT_BYTES - PCM_FMT_BYTES
    offset = writeChunkHeader(view, offset, 'fact', 4)
    view.setUint32(offset, numSamples, true)
    offset += 4
  }

  return writeChunkHeader(view, offset, 'data', dataSize)
}

/** Returns the offset just past the chunk header */
function writeChunkHeader(view: DataView, offset: number, id: string, size: number): number {
  writeAscii(view, offset, id)
  view.setUint32(offset + 4, size, true)
  return offset + CHUNK_HEADER_BYTES
}

// First occurrence of each chunk id; chunks are word-aligned, so odd sizes skip a pad byte
function locateChunks(view: DataView): Map<string, ChunkLocation> {
  const chunks = new Map<string, ChunkLocation>()
  let offset = RIFF_PREAMBLE_BYTES
  while (offset + CHUNK_HEADER_BYTES <= view.byteLength) {
    const id = readAscii(view, offset, 4)
    const size = view.getUint32(offset + 4, true)
    if (!chunks.has(id)) {
      chunks.set(id, { offset: offset + CHUNK_HEADER_BYTES, size })
    }
    offset += CHUNK_HEADER_BYTES + size + (size % 2)
  }
  return chunks
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
