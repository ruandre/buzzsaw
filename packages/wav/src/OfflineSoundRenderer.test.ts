import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OfflineSoundRenderer } from './OfflineSoundRenderer'

class MockOfflineAudioContext {
  sampleRate: number
  length: number
  currentTime = 0
  destination = {} as AudioDestinationNode

  constructor(public numberOfChannels: number, length: number, sampleRate: number) {
    this.length = length
    this.sampleRate = sampleRate
  }

  createGain() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      gain: {
        cancelScheduledValues: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        setValueAtTime: vi.fn(),
        value: 0.5,
      },
    }
  }

  createOscillator() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      frequency: {
        linearRampToValueAtTime: vi.fn(),
        setValueAtTime: vi.fn(),
      },
      onended: null,
      start: vi.fn(),
      stop: vi.fn(),
      type: 'sine',
    }
  }

  startRendering(): Promise<AudioBuffer> {
    return Promise.resolve({
      duration: this.length / this.sampleRate,
      getChannelData: () => new Float32Array(this.length),
      length: this.length,
      numberOfChannels: this.numberOfChannels,
      sampleRate: this.sampleRate,
    } as unknown as AudioBuffer)
  }
}

const ORIGINAL_OFFLINE = globalThis.OfflineAudioContext

beforeEach(() => {
  globalThis.OfflineAudioContext = MockOfflineAudioContext as unknown as typeof OfflineAudioContext
})

afterEach(() => {
  globalThis.OfflineAudioContext = ORIGINAL_OFFLINE
})

describe('offlineSoundRenderer', () => {
  it('detects support and constructor availability', () => {
    expect(OfflineSoundRenderer.isSupported()).toBe(true)
    expect(OfflineSoundRenderer.getOfflineAudioContextClass()).toBe(MockOfflineAudioContext)
  })

  it('renders a SoundDefinition to an AudioBuffer', async () => {
    const audioBuffer = await OfflineSoundRenderer.render({
      duration: 0.2,
      frequency: 880,
      waveType: 'square',
    })

    expect(audioBuffer).toBeDefined()
    expect(audioBuffer.sampleRate).toBe(44100)
    expect(audioBuffer.length).toBe(Math.ceil(0.2 * 44100))
  })

  it('calculates duration from envelope step times when duration is omitted', async () => {
    const audioBuffer = await OfflineSoundRenderer.render({
      frequency: {
        start: 440,
        steps: [{ time: 0.8, value: 880 }],
      },
    })

    expect(audioBuffer.duration).toBeGreaterThanOrEqual(0.8)
  })

  it('throws error when OfflineAudioContext is unsupported', async () => {
    globalThis.OfflineAudioContext = undefined as any
    await expect(OfflineSoundRenderer.render({ frequency: 440 })).rejects.toThrow(
      /OfflineAudioContext is not available/,
    )
  })

  it('renders with an injected context class when no global exists', async () => {
    globalThis.OfflineAudioContext = undefined as any

    const audioBuffer = await OfflineSoundRenderer.render(
      { duration: 0.1, frequency: 440 },
      { offlineAudioContextClass: MockOfflineAudioContext },
    )

    expect(audioBuffer.length).toBe(Math.ceil(0.1 * 44100))
  })

  it('rejects a sample rate below the 8000 Hz floor instead of clamping', async () => {
    await expect(OfflineSoundRenderer.render({ frequency: 440 }, { sampleRate: 10 }))
      .rejects
      .toThrow(RangeError)
  })
})
