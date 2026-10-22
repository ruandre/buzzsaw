import { SoundValidationError } from '@rjvr/buzzsaw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OfflineSoundRenderer } from './OfflineSoundRenderer.js'

const VOICE_SAMPLE = 0.5

// Web Audio "speakers" up-mix of a mono input: stereo copies to L/R, quad to front L/R, 5.1 to centre, others to channel 0
function speakerChannelsForMono(numberOfChannels: number): number[] {
  return ({ 2: [0, 1], 4: [0, 1], 6: [2] } as Record<number, number[]>)[numberOfChannels] ?? [0]
}

class MockOfflineAudioContext {
  sampleRate: number
  length: number
  currentTime = 0
  destination = { channelInterpretation: 'speakers', connect: vi.fn(), disconnect: vi.fn() }

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
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        setValueAtTime: vi.fn(),
        value: 440,
      },
      onended: null,
      setPeriodicWave: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      type: 'sine' as const,
    }
  }

  // Places a mono voice the way the destination's channel interpretation would
  startRendering(): Promise<AudioBuffer> {
    const channels = Array.from({ length: this.numberOfChannels }, () => new Float32Array(this.length))
    const voiced = this.destination.channelInterpretation === 'discrete' ? [0] : speakerChannelsForMono(this.numberOfChannels)
    for (const channel of voiced) {
      channels[channel]?.fill(VOICE_SAMPLE)
    }
    return Promise.resolve({
      duration: this.length / this.sampleRate,
      getChannelData: (channel: number) => channels[channel],
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

  it.each([1, 2, 3, 4, 6, 8])('writes the mono voice to every one of %i channels', async (numChannels) => {
    const audioBuffer = await OfflineSoundRenderer.render({ duration: 0.01, frequency: 440 }, { numChannels })

    expect(audioBuffer.numberOfChannels).toBe(numChannels)
    for (let channel = 0; channel < numChannels; channel++) {
      expect(audioBuffer.getChannelData(channel)[0], `channel ${channel}`).toBe(VOICE_SAMPLE)
    }
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

  it('rejects an invalid definition instead of rendering it', async () => {
    const construct = vi.spyOn(globalThis, 'OfflineAudioContext')

    await expect(OfflineSoundRenderer.render({ frequency: 440, gain: 2 }))
      .rejects
      .toThrow(SoundValidationError)
    expect(construct).not.toHaveBeenCalled()
  })

  it('rejects a sample rate below the 8000 Hz floor instead of clamping', async () => {
    await expect(OfflineSoundRenderer.render({ frequency: 440 }, { sampleRate: 10 }))
      .rejects
      .toThrow(RangeError)
  })

  it('rejects a fractional sample rate a WAV header cannot hold', async () => {
    await expect(OfflineSoundRenderer.render({ frequency: 440 }, { sampleRate: 22050.5 }))
      .rejects
      .toThrow(new RangeError('Invalid sampleRate: 22050.5. Must be an integer from 8000 to 4294967295.'))
  })
})
