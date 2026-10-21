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

  it('keeps 32-bit float samples past full scale, the headroom float exists for', () => {
    const view = new DataView(WavEncoder.encode([Float32Array.of(1.5, -2)], { bitDepth: 32 }))

    expect([view.getFloat32(58, true), view.getFloat32(62, true)]).toEqual([1.5, -2])
  })

  it('clips integer PCM samples past full scale to the end of the range', () => {
    const view = new DataView(WavEncoder.encode([Float32Array.of(1.5, -2)], { bitDepth: 16 }))

    expect([view.getInt16(44, true), view.getInt16(46, true)]).toEqual([0x7FFF, -0x8000])
  })

  it('rounds 8-bit samples either side of zero to the midpoint, as 16- and 24-bit do', () => {
    const samples = Float32Array.of(-0.4 / 128, 0.4 / 127, -0.6 / 128, 0.6 / 127)
    const view = new DataView(WavEncoder.encode([samples], { bitDepth: 8 }))

    const decoded = [0, 1, 2, 3].map(index => view.getUint8(44 + index))
    expect(decoded).toEqual([128, 128, 127, 129])
  })

  it('rounds 16-bit samples to the nearest step instead of flooring toward negative infinity', () => {
    const samples = Float32Array.of(-0.4 / 0x8000, 0.6 / 0x7FFF, -1, 1)
    const view = new DataView(WavEncoder.encode([samples], { bitDepth: 16 }))

    const decoded = [0, 1, 2, 3].map(index => view.getInt16(44 + index * 2, true))
    expect(decoded).toEqual([0, 1, -0x8000, 0x7FFF])
  })

  it('rounds 24-bit samples to the nearest step instead of flooring toward negative infinity', () => {
    const samples = Float32Array.of(-0.4 / 0x800000, 0.6 / 0x7FFFFF, -1, 1)
    const view = new DataView(WavEncoder.encode([samples], { bitDepth: 24 }))

    const readInt24 = (offset: number) =>
      ((view.getUint8(offset) | (view.getUint8(offset + 1) << 8) | (view.getUint8(offset + 2) << 16)) << 8) >> 8
    const decoded = [0, 1, 2, 3].map(index => readInt24(44 + index * 3))
    expect(decoded).toEqual([0, 1, -0x800000, 0x7FFFFF])
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
      .toThrow(new RangeError('Invalid sampleRate: 100. Must be an integer from 8000 to 4294967295.'))
    expect(() => WavEncoder.encode([new Float32Array(4)], { numChannels: 0 }))
      .toThrow(new RangeError('Invalid numChannels: 0. Must be an integer from 1 to 65535.'))
    expect(() => WavEncoder.encode([new Float32Array(4)], { numChannels: 1.5 }))
      .toThrow(new RangeError('Invalid numChannels: 1.5. Must be an integer from 1 to 65535.'))
  })

  it('rejects a fractional sampleRate, which the integer header field cannot hold', () => {
    expect(() => WavEncoder.encode([new Float32Array(4)], { sampleRate: 22050.5 }))
      .toThrow(new RangeError('Invalid sampleRate: 22050.5. Must be an integer from 8000 to 4294967295.'))
  })

  it('rejects a sampleRate too large for its uint32 header field', () => {
    expect(() => WavEncoder.encode([new Float32Array(4)], { sampleRate: 5e9 }))
      .toThrow(new RangeError('Invalid sampleRate: 5000000000. Must be an integer from 8000 to 4294967295.'))
  })

  it('rejects audio too long for the uint32 RIFF size field instead of writing a wrapped header', () => {
    // 2^30 stereo 16-bit frames is 4 GiB of data; checked before any buffer is allocated
    const tooLong = { numberOfChannels: 2, sampleRate: 44100, length: 2 ** 30, duration: 0, getChannelData: () => new Float32Array(0) }

    expect(() => WavEncoder.encode(tooLong, { bitDepth: 16 }))
      .toThrow(new RangeError('Audio too long for WAV: 4294967332 RIFF bytes exceed the 4294967295-byte limit of its uint32 size field.'))
  })

  it('rejects a numChannels too large for its uint16 header field', () => {
    expect(() => WavEncoder.encode([new Float32Array(4)], { numChannels: 70000, bitDepth: 8 }))
      .toThrow(new RangeError('Invalid numChannels: 70000. Must be an integer from 1 to 65535.'))
  })

  it('rejects a numChannels whose blockAlign overflows uint16 at the chosen bit depth', () => {
    expect(() => WavEncoder.encode([new Float32Array(4)], { numChannels: 40000, bitDepth: 16 }))
      .toThrow(new RangeError('Invalid numChannels: 40000. Must be at most 32767 at bit depth 16.'))
  })

  it('rejects a sampleRate whose byteRate overflows uint32 at the chosen layout', () => {
    expect(() => WavEncoder.encode([new Float32Array(4)], { sampleRate: 3e9, bitDepth: 16 }))
      .toThrow(new RangeError(
        'Invalid sampleRate: 3000000000. Must be at most 2147483647 with numChannels 1 at bit depth 16.',
      ))
  })

  it('returns null from decodeHeader when the data chunk claims more bytes than the buffer holds', () => {
    const truncated = WavEncoder.encode([new Float32Array(1000)]).slice(0, 100)

    expect(WavEncoder.decodeHeader(truncated)).toBeNull()
  })
})

describe('wavEncoder header decoding on malformed input', () => {
  const encoded = () => new Uint8Array(WavEncoder.encode([new Float32Array(2)], { sampleRate: 8000 }))

  it('returns null for a buffer shorter than the RIFF preamble', () => {
    expect(WavEncoder.decodeHeader(new ArrayBuffer(11))).toBeNull()
  })

  it('returns null for a WAVE file with no fmt chunk', () => {
    const bytes = encoded()
    bytes.set([...'junk'].map(char => char.charCodeAt(0)), 12)

    expect(WavEncoder.decodeHeader(bytes.buffer)).toBeNull()
  })

  it('returns null for a WAVE file with no data chunk', () => {
    const bytes = encoded()
    bytes.set([...'junk'].map(char => char.charCodeAt(0)), 36)

    expect(WavEncoder.decodeHeader(bytes.buffer)).toBeNull()
  })

  it('returns null when the fmt chunk is too short to hold the PCM fields', () => {
    const bytes = encoded()
    new DataView(bytes.buffer).setUint32(16, 12, true)

    expect(WavEncoder.decodeHeader(bytes.buffer)).toBeNull()
  })

  it('returns null when a chunk size runs past the end of the buffer', () => {
    const bytes = encoded()
    new DataView(bytes.buffer).setUint32(16, 0xFFFFFFF0, true)

    expect(WavEncoder.decodeHeader(bytes.buffer)).toBeNull()
  })

  it('skips the pad byte of an odd-sized chunk that precedes the data chunk', () => {
    const pcm = encoded()
    const list = [...'LIST', 5, 0, 0, 0, ...'INFOa', 0].map(value => typeof value === 'string' ? value.charCodeAt(0) : value)
    const withList = Uint8Array.from([...pcm.slice(0, 36), ...list, ...pcm.slice(36)])

    expect(WavEncoder.decodeHeader(withList.buffer)?.dataSize).toBe(4)
  })

  it('reports a zero duration rather than dividing by a zero byte rate', () => {
    const bytes = encoded()
    new DataView(bytes.buffer).setUint32(28, 0, true)

    expect(WavEncoder.decodeHeader(bytes.buffer)?.duration).toBe(0)
  })

  it('derives duration, byteRate and blockAlign from the layout', () => {
    const header = WavEncoder.decodeHeader(WavEncoder.encode([new Float32Array(4000)], { sampleRate: 8000, bitDepth: 24, numChannels: 2 }).slice(0))

    expect(header).toMatchObject({ blockAlign: 6, byteRate: 48000, duration: 0.5 })
  })
})

describe('wavEncoder multichannel layouts', () => {
  it('duplicates a mono source into every channel of a 24-bit stereo file', () => {
    const arrayBuffer = WavEncoder.encode([new Float32Array([0.5, -0.5])], { bitDepth: 24, numChannels: 2, sampleRate: 8000 })
    const data = new Uint8Array(arrayBuffer, 44)

    expect(arrayBuffer.byteLength).toBe(44 + 2 * 2 * 3)
    expect([...data.slice(0, 3)]).toEqual([...data.slice(3, 6)])
    expect([...data.slice(6, 9)]).toEqual([...data.slice(9, 12)])
  })

  it('writes the frame count, not the sample count, into the float fact chunk', () => {
    const arrayBuffer = WavEncoder.encode([new Float32Array(7)], { bitDepth: 32, numChannels: 2 })

    expect(new DataView(arrayBuffer).getUint32(46, true)).toBe(7)
  })

  it('interleaves distinct channels frame by frame', () => {
    const left = new Float32Array([0.25, 0.5])
    const right = new Float32Array([-0.25, -0.5])
    const view = new DataView(WavEncoder.encode([left, right], { bitDepth: 16, sampleRate: 8000 }))

    expect([44, 46, 48, 50].map(offset => view.getInt16(offset, true))).toEqual([8192, -8192, 16384, -16384])
  })

  it('writes silence for a channel shorter than the first', () => {
    const view = new DataView(WavEncoder.encode([new Float32Array([0.5, 0.5]), new Float32Array([0.5])], { bitDepth: 16, sampleRate: 8000 }))

    expect(view.getInt16(50, true)).toBe(0)
  })

  it('writes a zero pad byte after an odd-sized data chunk', () => {
    const arrayBuffer = WavEncoder.encode([new Float32Array([1, 1, 1])], { bitDepth: 8, sampleRate: 8000 })

    expect(new Uint8Array(arrayBuffer).at(-1)).toBe(0)
    expect(arrayBuffer.byteLength % 2).toBe(0)
  })

  it('encodes an empty channel list as a header-only file', () => {
    const arrayBuffer = WavEncoder.encode([], { sampleRate: 8000 })

    expect(arrayBuffer.byteLength).toBe(44)
    expect(WavEncoder.decodeHeader(arrayBuffer)?.dataSize).toBe(0)
  })

  it('writes non-finite samples as silence', () => {
    const view = new DataView(WavEncoder.encode([new Float32Array([Number.NaN, Infinity])], { bitDepth: 16, sampleRate: 8000 }))

    expect([view.getInt16(44, true), view.getInt16(46, true)]).toEqual([0, 0])
  })
})
