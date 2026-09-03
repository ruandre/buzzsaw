import type { MockAudioContext } from './testing/mockAudioContext'
import { beforeEach, describe, expect, it } from 'vitest'
import { playSoundFromDefinition, validateSoundDefinition } from './soundPlayer'
import { createMockAudioContext } from './testing/mockAudioContext'

describe('soundPlayer validateSoundDefinition', () => {
  it('returns errors for non-objects or null', () => {
    expect(validateSoundDefinition(null)).toHaveLength(1)
    expect(validateSoundDefinition(undefined)).toHaveLength(1)
    expect(validateSoundDefinition('not an object')).toHaveLength(1)
  })

  it('validates waveType', () => {
    expect(validateSoundDefinition({ waveType: 'invalid' as any, frequency: 440 })).toEqual([
      'Invalid waveType "invalid". Expected one of: sine, square, sawtooth, triangle, custom',
    ])
  })

  it('validates frequency numbers and envelopes', () => {
    expect(validateSoundDefinition({ frequency: -10 })).toContain('Invalid frequency number: -10. Must be a positive finite number.')
    expect(validateSoundDefinition({ frequency: { start: 0, steps: [] } })).toContain('Invalid frequency start: 0. Must be a positive finite number.')
    expect(validateSoundDefinition({ frequency: { start: 440, steps: 'invalid' as any } })).toContain('Frequency steps must be an array.')
  })

  it('validates gain and timing parameters', () => {
    expect(validateSoundDefinition({ frequency: 440, gain: -0.5 })).toContain('Invalid gain number: -0.5. Must be a non-negative finite number.')
    expect(validateSoundDefinition({ frequency: 440, duration: -1 })).toContain('Invalid duration: -1. Must be a positive number.')
    expect(validateSoundDefinition({ frequency: 440, attack: -0.1 })).toContain('Invalid attack: -0.1. Must be a non-negative number.')
    expect(validateSoundDefinition({ frequency: 440, decay: -0.1 })).toContain('Invalid decay: -0.1. Must be a non-negative number.')
  })

  it('rejects a custom waveType with no harmonics to build it from', () => {
    const expected = 'A "custom" waveType requires a non-empty "partials" array of harmonic amplitudes.'
    expect(validateSoundDefinition({ frequency: 440, waveType: 'custom' })).toContain(expected)
    expect(validateSoundDefinition({ frequency: 440, waveType: 'custom', partials: [0, 0] })).toContain(expected)
    expect(validateSoundDefinition({ frequency: 440, waveType: 'custom', partials: [1, 0.5] })).toEqual([])
  })

  it('validates partials independently of waveType', () => {
    expect(validateSoundDefinition({ frequency: 440, partials: 'nope' as any }))
      .toContain('Partials must be an array of harmonic amplitudes.')
    expect(validateSoundDefinition({ frequency: 440, partials: [1, Number.NaN] }))
      .toContain('Partials must contain only finite numbers.')
    expect(validateSoundDefinition({ frequency: 440, partials: Array.from({ length: 65 }).fill(1) }))
      .toContain('Too many partials: 65. At most 64 harmonics are supported.')
  })

  it('returns empty array for valid definition', () => {
    expect(validateSoundDefinition({
      attack: 0.01,
      decay: 0.05,
      duration: 0.2,
      frequency: {
        start: 440,
        steps: [{ time: 0.1, value: 880 }],
      },
      gain: 0.3,
      waveType: 'square',
    })).toEqual([])
  })
})

describe('soundPlayer playSoundFromDefinition', () => {
  let mockCtx: MockAudioContext

  beforeEach(() => {
    mockCtx = createMockAudioContext()
  })

  it('plays fixed frequency and gain successfully', () => {
    const handle = playSoundFromDefinition(mockCtx, {
      duration: 0.3,
      frequency: 440,
      gain: 0.5,
      waveType: 'triangle',
    })

    expect(handle.isPlaying).toBe(true)
    expect(mockCtx.createOscillator).toHaveBeenCalled()
    expect(mockCtx.createGain).toHaveBeenCalled()
  })

  it('handles dynamic frequency and gain steps', () => {
    const handle = playSoundFromDefinition(mockCtx, {
      duration: 0.4,
      frequency: {
        start: 300,
        steps: [
          { time: 0.1, value: 600 },
          { time: 0.2, value: 900 },
        ],
      },
      gain: {
        start: 0.2,
        steps: [
          { time: 0.1, value: 0.5 },
          { time: 0.3, value: 0.001 },
        ],
      },
      waveType: 'sawtooth',
    })

    expect(handle.isPlaying).toBe(true)
  })

  it('scales volume and pitch accurately', () => {
    const handle = playSoundFromDefinition(mockCtx, {
      duration: 0.1,
      frequency: 440,
      gain: 0.5,
    }, {
      pitchScale: 2.0,
      volume: 0.5,
    })

    expect(handle.isPlaying).toBe(true)
  })

  it('handles volume 0 (muted) without throwing', () => {
    const handle = playSoundFromDefinition(mockCtx, {
      duration: 0.1,
      frequency: 440,
      gain: 0.5,
    }, { volume: 0 })

    expect(handle.isPlaying).toBe(true)
    handle.stop()
    expect(handle.isPlaying).toBe(false)
  })

  it('routes to an explicit destination instead of the speakers', () => {
    const capture = mockCtx.createGain()
    playSoundFromDefinition(mockCtx, { duration: 0.1, frequency: 440 }, {
      destination: capture as unknown as AudioNode,
    })

    const voiceGain = mockCtx.gainNodes[mockCtx.gainNodes.length - 1]
    expect(voiceGain.connect).toHaveBeenCalledWith(capture)
  })

  it('synthesises a custom wave from its partials', () => {
    playSoundFromDefinition(mockCtx, {
      duration: 0.1,
      frequency: 440,
      partials: [1, 0.5],
      waveType: 'custom',
    })

    expect(mockCtx.createPeriodicWave).toHaveBeenCalled()
    expect(mockCtx.oscillators[0].setPeriodicWave).toHaveBeenCalled()
  })

  it('stops cleanly when stop() is called', () => {
    const handle = playSoundFromDefinition(mockCtx, {
      duration: 0.5,
      frequency: 440,
    })

    expect(handle.isPlaying).toBe(true)
    handle.stop()
    expect(handle.isPlaying).toBe(false)
  })
})

describe('scheduling against a running context clock', () => {
  // Non-zero currentTime verifies scheduling offsets are relative to context clock
  const CONTEXT_TIME = 100

  function playAt(definition: SoundDefinition, currentTime: number) {
    const context = createMockAudioContext({ currentTime })
    playSoundFromDefinition(context, definition)
    return context.gainNodes[0]
  }

  it('holds a fixed gain at peak until the decay begins', () => {
    const definition: SoundDefinition = {
      frequency: 440,
      gain: 0.5,
      duration: 0.5,
      attack: 0.01,
      decay: 0.1,
    }

    const gain = playAt(definition, CONTEXT_TIME)

    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.5, CONTEXT_TIME + 0.4)
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, CONTEXT_TIME + 0.5)
  })

  it('schedules the same envelope shape whatever the clock reads', () => {
    const definition: SoundDefinition = {
      frequency: 440,
      gain: 0.5,
      duration: 0.5,
      attack: 0.01,
      decay: 0.1,
    }

    const offsets = (currentTime: number) =>
      playAt(definition, currentTime).gain.setValueAtTime.mock.calls.map(([value, time]: [number, number]) => [value, +(time - currentTime).toFixed(6)])

    expect(offsets(CONTEXT_TIME)).toEqual(offsets(0))
  })

  it('rides a gain envelope down from its last step, not from the clock', () => {
    const definition: SoundDefinition = {
      frequency: 440,
      gain: { start: 0.1, steps: [{ value: 0.6, time: 0.1 }] },
      duration: 0.5,
      decay: 0.2,
    }

    const gain = playAt(definition, CONTEXT_TIME)

    // Decay ramp starts at max(lastStep.time, decayStart)
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.6, CONTEXT_TIME + 0.3)
  })
})
