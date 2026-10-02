import type { MockAudioContext } from './testing/mockAudioContext.js'
import type { SoundDefinition } from './types.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { playSoundFromDefinition, validateSoundDefinition } from './soundPlayer.js'
import { createMockAudioContext } from './testing/mockAudioContext.js'
import { sampleFrequencyAtTime, sampleGainAtTime } from './utils.js'

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
    const range = 'Must be a finite number greater than 0 and at most 20000.'
    expect(validateSoundDefinition({ frequency: -10 })).toContain(`Invalid frequency number: -10. ${range}`)
    expect(validateSoundDefinition({ frequency: { start: 0, steps: [] } })).toContain(`Invalid frequency start: 0. ${range}`)
    expect(validateSoundDefinition({ frequency: { start: 440, steps: 'invalid' as any } })).toContain('Frequency steps must be an array.')
  })

  it('rejects frequencies above the audible range instead of rendering silence', () => {
    const range = 'Must be a finite number greater than 0 and at most 20000.'
    expect(validateSoundDefinition({ frequency: 5e9 })).toContain(`Invalid frequency number: 5000000000. ${range}`)
    expect(validateSoundDefinition({ frequency: { start: 440, steps: [{ value: 30000, time: 0.1 }] } }))
      .toContain(`Invalid frequency step at index 0: 30000. ${range}`)
    expect(validateSoundDefinition({ frequency: 20000 })).toEqual([])
  })

  it('rejects gain above unity instead of clipping it', () => {
    const range = 'Must be a finite number between 0 and 1.'
    expect(validateSoundDefinition({ frequency: 440, gain: 5 })).toContain(`Invalid gain number: 5. ${range}`)
    expect(validateSoundDefinition({ frequency: 440, gain: { start: 2, steps: [] } })).toContain(`Invalid gain start: 2. ${range}`)
    expect(validateSoundDefinition({ frequency: 440, gain: { start: 0.5, steps: [{ value: 1.5, time: 0.1 }] } }))
      .toContain(`Invalid gain step at index 0: 1.5. ${range}`)
    expect(validateSoundDefinition({ frequency: 440, gain: 1 })).toEqual([])
  })

  it('rejects a step scheduled before the sound starts', () => {
    expect(validateSoundDefinition({ frequency: { start: 440, steps: [{ value: 880, time: -1 }] } }))
      .toContain(`Invalid frequency step time at index 0: -1. Must be an offset of at least 0 seconds from the sound's start.`)
    expect(validateSoundDefinition({ frequency: 440, gain: { start: 0.5, steps: [{ value: 0.1, time: -0.5 }] } }))
      .toContain(`Invalid gain step time at index 0: -0.5. Must be an offset of at least 0 seconds from the sound's start.`)
  })

  it('rejects a gain that is neither a number nor an envelope', () => {
    expect(validateSoundDefinition({ frequency: 440, gain: '0.5' as any }))
      .toEqual(['Gain must be either a number or an object with start and steps.'])
  })

  it('rejects an array as a definition', () => {
    expect(validateSoundDefinition([])).toEqual(['Sound definition must be a non-null object.'])
  })

  it('rejects unknown properties so a misspelled key is not silently dropped', () => {
    expect(validateSoundDefinition({ frequency: 440, waveform: 'square' } as any))
      .toContain('Unknown property "waveform". Expected one of: waveType, partials, frequency, gain, duration, attack, decay')
    expect(validateSoundDefinition({ frequency: 440, name: 'blip', volume: 1 } as any))
      .toContain('Unknown properties "name", "volume". Expected one of: waveType, partials, frequency, gain, duration, attack, decay')
    expect(validateSoundDefinition({ frequency: { start: 440, steps: [], interpolate: 'linear' } } as any))
      .toContain('Unknown frequency envelope property "interpolate". Expected one of: start, steps, interpolation')
  })

  it('validates gain and timing parameters', () => {
    expect(validateSoundDefinition({ frequency: 440, gain: -0.5 })).toContain('Invalid gain number: -0.5. Must be a finite number between 0 and 1.')
    expect(validateSoundDefinition({ frequency: 440, duration: -1 })).toContain('Invalid duration: -1. Must be a finite number of at least 0.01.')
    expect(validateSoundDefinition({ frequency: 440, duration: 0.001 })).toContain('Invalid duration: 0.001. Must be a finite number of at least 0.01.')
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

  it('keeps the voice connected until the stop fade has played', () => {
    const handle = playSoundFromDefinition(mockCtx, { duration: 0.5, frequency: 440 })
    const oscillator = mockCtx.oscillators[0]
    const voiceGain = mockCtx.gainNodes[0]

    handle.stop()
    expect(voiceGain.disconnect).not.toHaveBeenCalled()

    oscillator.onended?.()
    expect(voiceGain.disconnect).toHaveBeenCalledOnce()
    expect(oscillator.disconnect).toHaveBeenCalledOnce()
  })

  it('disconnects a stopped voice even if the oscillator never reports ending', () => {
    vi.useFakeTimers()
    try {
      const handle = playSoundFromDefinition(mockCtx, { duration: 0.5, frequency: 440 })
      const voiceGain = mockCtx.gainNodes[0]

      handle.stop()
      vi.advanceTimersByTime(1000)

      expect(voiceGain.disconnect).toHaveBeenCalledOnce()
    }
    finally {
      vi.useRealTimers()
    }
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
      playAt(definition, currentTime).gain.setValueAtTime.mock.calls.map(([value, time]) => [value, +(time - currentTime).toFixed(6)])

    expect(offsets(CONTEXT_TIME)).toEqual(offsets(0))
  })

  it('ramps a gain envelope in over the attack instead of jumping to its start value', () => {
    const definition: SoundDefinition = {
      frequency: 440,
      gain: { start: 0.6, steps: [{ value: 0.2, time: 0.3 }] },
      duration: 0.5,
      attack: 0.05,
    }

    const gain = playAt(definition, CONTEXT_TIME)

    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, CONTEXT_TIME)
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.6, CONTEXT_TIME + 0.05)
  })

  it('yields the attack ramp to a step authored before the attack ends', () => {
    const definition: SoundDefinition = {
      frequency: 440,
      gain: { start: 0.6, steps: [{ value: 0.2, time: 0.01 }] },
      duration: 0.5,
      attack: 0.05,
    }

    const gain = playAt(definition, CONTEXT_TIME)

    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.6, CONTEXT_TIME + 0.01)
  })

  it('keeps a decay window when the attack covers the whole duration', () => {
    const definition: SoundDefinition = {
      frequency: 440,
      gain: 0.5,
      duration: 0.2,
      attack: 0.5,
    }

    const gain = playAt(definition, CONTEXT_TIME)

    // Attack yields MIN_DECAY_WINDOW_S so the voice fades instead of cutting off at peak
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, CONTEXT_TIME + 0.199)
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, CONTEXT_TIME + 0.2)
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

  it('decays a gain envelope that has no steps instead of cutting it off', () => {
    const definition: SoundDefinition = {
      frequency: 440,
      gain: { start: 0.5, steps: [] },
      duration: 0.5,
      decay: 0.1,
    }

    const gain = playAt(definition, CONTEXT_TIME)

    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.5, CONTEXT_TIME + 0.4)
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, CONTEXT_TIME + 0.5)
  })
})

describe('playSoundFromDefinition with non-finite fields', () => {
  function scheduledValues(context: MockAudioContext): unknown[] {
    const params = [context.oscillators[0].frequency, context.gainNodes[0].gain]
    return params.flatMap(param => [
      ...param.setValueAtTime.mock.calls,
      ...param.linearRampToValueAtTime.mock.calls,
      ...param.exponentialRampToValueAtTime.mock.calls,
    ].flat())
  }

  it.each([
    ['NaN frequency', { frequency: Number.NaN }],
    ['infinite frequency', { frequency: Infinity }],
    ['NaN frequency envelope start', { frequency: { start: Number.NaN, steps: [{ value: 880, time: 0.1 }] } }],
    ['NaN gain', { frequency: 440, gain: Number.NaN }],
    ['infinite gain', { frequency: 440, gain: Infinity }],
    ['NaN gain envelope start', { frequency: 440, gain: { start: Number.NaN, steps: [{ value: 0.2, time: 0.3 }] } }],
  ])('hands AudioParams only finite values for %s', (_, definition) => {
    const context = createMockAudioContext()

    playSoundFromDefinition(context, definition)

    expect(scheduledValues(context).filter(value => !Number.isFinite(value))).toEqual([])
  })

  it('falls back to the frequency the sampler reports', () => {
    const scalar = { frequency: Number.NaN }
    const envelope = { frequency: { start: Number.NaN, steps: [{ value: 880, time: 0.1 }] } }

    for (const definition of [scalar, envelope]) {
      const context = createMockAudioContext()
      playSoundFromDefinition(context, definition)
      expect(context.oscillators[0].frequency.setValueAtTime)
        .toHaveBeenCalledWith(sampleFrequencyAtTime(definition, 0), 0)
    }
  })

  it('ramps up to the gain the sampler reports', () => {
    const timing = { frequency: 440, duration: 0.5, attack: 0.05, decay: 0.1 }
    const scalar = { ...timing, gain: Number.NaN }
    const envelope = { ...timing, gain: { start: Number.NaN, steps: [{ value: 0.2, time: 0.3 }] } }

    for (const definition of [scalar, envelope]) {
      const context = createMockAudioContext()
      playSoundFromDefinition(context, definition)
      expect(context.gainNodes[0].gain.linearRampToValueAtTime)
        .toHaveBeenCalledWith(sampleGainAtTime(definition, 0.05), 0.05)
    }
  })
})
