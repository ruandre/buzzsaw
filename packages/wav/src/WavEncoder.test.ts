import { describe, expect, it } from 'vitest'
import { WavEncoder } from './WavEncoder.js'

describe('wavEncoder', () => {
  it('encodes Float32Array channel samples into a valid 16-bit RIFF/WAVE ArrayBuffer', () => {
    const sampleRate = 44100
    const length = 441
    const channelData = new Float32Array(length)

    for (let i = 0; i < length; i++) {
      channelData[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate)
    }

    const arrayBuffer = WavEncoder.encode([channelData], {
      bitDepth: 16,
      numChannels: 1,
      sampleRate,
    })

    expect(arrayBuffer.byteLength).toBe(44 + length * 2)

    const header = WavEncoder.decodeHeader(arrayBuffer)
    expect(header).not.toBeNull()
    expect(header?.audioFormat).toBe(1)
    expect(header?.numChannels).toBe(1)
    expect(header?.sampleRate).toBe(44100)
    expect(header?.bitDepth).toBe(16)
    expect(header?.dataSize).toBe(length * 2)
  })

  it('encodes 8-bit unsigned PCM WAV', () => {
    const channelData = new Float32Array(200)
    const arrayBuffer = WavEncoder.encode([channelData], {
      bitDepth: 8,
      numChannels: 1,
      sampleRate: 22050,
    })

    expect(arrayBuffer.byteLength).toBe(44 + 200 * 1)
    const header = WavEncoder.decodeHeader(arrayBuffer)
    expect(header?.bitDepth).toBe(8)
    expect(header?.sampleRate).toBe(22050)
  })

  it('encodes 24-bit signed PCM WAV', () => {
    const channelData = new Float32Array(100)
    const arrayBuffer = WavEncoder.encode([channelData], {
      bitDepth: 24,
      numChannels: 1,
      sampleRate: 48000,
    })

    expect(arrayBuffer.byteLength).toBe(44 + 100 * 3)
    const header = WavEncoder.decodeHeader(arrayBuffer)
    expect(header?.bitDepth).toBe(24)
    expect(header?.sampleRate).toBe(48000)
  })

  it('encodes 32-bit IEEE float WAV', () => {
    const channelData = new Float32Array(100)
    const arrayBuffer = WavEncoder.encode([channelData], {
      bitDepth: 32,
      numChannels: 2,
      sampleRate: 44100,
    })

    expect(arrayBuffer.byteLength).toBe(58 + 100 * 2 * 4)
    const header = WavEncoder.decodeHeader(arrayBuffer)
    expect(header?.audioFormat).toBe(3)
    expect(header?.bitDepth).toBe(32)
    expect(header?.numChannels).toBe(2)
  })

  it('writes the cbSize field and fact chunk a non-PCM format requires', () => {
    const arrayBuffer = WavEncoder.encode([new Float32Array(5)], { bitDepth: 32 })
    const view = new DataView(arrayBuffer)
    const ascii = (offset: number) => String.fromCharCode(...new Uint8Array(arrayBuffer, offset, 4))

    expect(view.getUint32(16, true)).toBe(18)
    expect(view.getUint16(36, true)).toBe(0)
    expect(ascii(38)).toBe('fact')
    expect(view.getUint32(42, true)).toBe(4)
    expect(view.getUint32(46, true)).toBe(5)
    expect(ascii(50)).toBe('data')
    expect(view.getUint32(4, true)).toBe(arrayBuffer.byteLength - 8)
  })

  it('decodes a header past chunks it does not know', () => {
    const pcm = new Uint8Array(WavEncoder.encode([new Float32Array(2)], { sampleRate: 8000 }))
    const list = [...'LIST', '\x06', '\0', '\0', '\0', ...'INFOab'].map(char => char.charCodeAt(0))
    const withList = Uint8Array.from([...pcm.slice(0, 36), ...list, ...pcm.slice(36)])

    const header = WavEncoder.decodeHeader(withList.buffer)

    expect(header?.sampleRate).toBe(8000)
    expect(header?.dataSize).toBe(4)
  })

  it('throws for unsupported bit depth', () => {
    const channelData = new Float32Array(10)
    expect(() => WavEncoder.encode([channelData], { bitDepth: 12 as any })).toThrow()
  })

  it('creates Blob from audio data', () => {
    const channelData = new Float32Array(100)
    const blob = WavEncoder.encodeToBlob([channelData], { sampleRate: 44100 })

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('audio/wav')
    expect(blob.size).toBe(44 + 100 * 2)
  })

  it('returns null on invalid buffer in decodeHeader', () => {
    expect(WavEncoder.decodeHeader(new ArrayBuffer(20))).toBeNull()
    expect(WavEncoder.decodeHeader(new ArrayBuffer(50))).toBeNull()
  })

  it('rejects an unsupported bit depth with a RangeError', () => {
    expect(() => WavEncoder.encode([new Float32Array(4)], { bitDepth: 12 as never }))
      .toThrow(new RangeError('Unsupported bit depth: 12. Supported depths are 8, 16, 24, 32.'))
  })

  it('centres 8-bit silence on 128, the unsigned midpoint', () => {
    const view = new DataView(WavEncoder.encode([Float32Array.of(-1, 0, 1, 0)], { bitDepth: 8 }))

    expect([view.getUint8(44), view.getUint8(45), view.getUint8(46)]).toEqual([0, 128, 255])
  })

  it('pads an odd-length data chunk to an even size, as RIFF requires', () => {
    const arrayBuffer = WavEncoder.encode([new Float32Array(3)], { bitDepth: 8 })
    const view = new DataView(arrayBuffer)

    expect(arrayBuffer.byteLength).toBe(44 + 3 + 1)
    expect(view.getUint32(4, true)).toBe(36 + 3 + 1)
    expect(WavEncoder.decodeHeader(arrayBuffer)?.dataSize).toBe(3)
  })

  it('keeps an audio buffer\'s own sample rate when none is given', () => {
    const audioBuffer = {
      numberOfChannels: 1,
      length: 4,
      sampleRate: 48000,
      duration: 4 / 48000,
      getChannelData: () => new Float32Array(4),
    }

    const header = WavEncoder.decodeHeader(WavEncoder.encode(audioBuffer))

    expect(header?.sampleRate).toBe(48000)
  })

  it('writes 44100 Hz for raw channels when no sample rate is given', () => {
    const header = WavEncoder.decodeHeader(WavEncoder.encode([new Float32Array(4)]))

    expect(header?.sampleRate).toBe(44100)
  })

  it('rejects out-of-range sampleRate and numChannels, matching the offline renderer', () => {
    expect(() => WavEncoder.encode([new Float32Array(4)], { sampleRate: 100 }))
      .toThrow(new RangeError('Invalid sampleRate: 100. Must be a finite number of at least 8000.'))
    expect(() => WavEncoder.encode([new Float32Array(4)], { numChannels: 0 }))
      .toThrow(new RangeError('Invalid numChannels: 0. Must be an integer of at least 1.'))
    expect(() => WavEncoder.encode([new Float32Array(4)], { numChannels: 1.5 }))
      .toThrow(new RangeError('Invalid numChannels: 1.5. Must be an integer of at least 1.'))
  })
})
