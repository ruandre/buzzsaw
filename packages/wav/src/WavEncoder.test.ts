import { describe, expect, it } from 'vitest'
import { WavEncoder } from './WavEncoder'

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

    expect(arrayBuffer.byteLength).toBe(44 + 100 * 2 * 4)
    const header = WavEncoder.decodeHeader(arrayBuffer)
    expect(header?.audioFormat).toBe(3)
    expect(header?.bitDepth).toBe(32)
    expect(header?.numChannels).toBe(2)
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
})
