import type { MockAudioContext, MockGainNode } from './testing/mockAudioContext.js'
import type { SoundDefinition } from './types.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playSoundFromDefinition } from './soundPlayer.js'
import { createMockAudioContext } from './testing/mockAudioContext.js'
import { sampleFrequencyAtTime, sampleGainAtTime } from './utils.js'
import { validateSoundDefinition } from './validation.js'

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

describe('wall-clock fallbacks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('arms a fallback timer for a realtime context', () => {
    playSoundFromDefinition(createMockAudioContext(), { duration: 0.5, frequency: 440 })

    expect(vi.getTimerCount()).toBe(1)
  })

  it('leaves no timer behind on an offline context, which renders faster than real time', () => {
    const offlineContext = Object.assign(createMockAudioContext(), { startRendering: vi.fn() })

    const handle = playSoundFromDefinition(offlineContext, { duration: 0.5, frequency: 440 })
    handle.stop()

    expect(vi.getTimerCount()).toBe(0)
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

  it('decays a stepless envelope with a non-finite start from the level the sampler reports', () => {
    const definition: SoundDefinition = {
      frequency: 440,
      gain: { start: Number.NaN, steps: [] },
      duration: 0.5,
      decay: 0.1,
    }

    const gain = playAt(definition, CONTEXT_TIME)

    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(sampleGainAtTime(definition, 0.3), CONTEXT_TIME + 0.4)
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

type MockAudioParam = MockGainNode['gain']

interface AutomationEvent {
  kind: 'set' | 'linear' | 'exponential'
  value: number
  time: number
  order: number
}

function automationEvents(param: MockAudioParam): AutomationEvent[] {
  const recorded = (kind: AutomationEvent['kind'], method: MockAudioParam['setValueAtTime']) =>
    method.mock.calls.map(([value, time], index): AutomationEvent =>
      ({ kind, value, time, order: method.mock.invocationCallOrder[index] }))

  return [
    ...recorded('set', param.setValueAtTime),
    ...recorded('linear', param.linearRampToValueAtTime),
    ...recorded('exponential', param.exponentialRampToValueAtTime),
  ].sort((a, b) => a.time - b.time || a.order - b.order)
}

// Web Audio spec: ramp runs from preceding event's value and time; last event's value holds
function automatedValueAt(param: MockAudioParam, time: number): number {
  const events = automationEvents(param)
  const nextIndex = events.findIndex(event => event.time > time)
  const next = nextIndex === -1 ? undefined : events[nextIndex]
  const previous = events[(nextIndex === -1 ? events.length : nextIndex) - 1] ?? { value: param.value, time: 0 }

  if (next === undefined || next.kind === 'set') {
    return previous.value
  }
  const progress = (time - previous.time) / (next.time - previous.time)
  if (next.kind === 'linear') {
    return previous.value + (next.value - previous.value) * progress
  }
  // Spec holds previous value until ramp end when exponential ramp cannot cross zero
  if (previous.value * next.value <= 0) {
    return previous.value
  }
  return previous.value * (next.value / previous.value) ** progress
}

describe('sampleGainAtTime against scheduled playback', () => {
  const timing = { frequency: 440, duration: 0.5, decay: 0.1 }

  function playedGain(definition: SoundDefinition): MockAudioParam {
    const context = createMockAudioContext()
    playSoundFromDefinition(context, definition)
    return context.gainNodes[0].gain
  }

  const sampleTimes = Array.from({ length: 501 }, (_, index) => index / 1000)

  it.each([
    ['linear envelope whose attack ends before its first step', {
      ...timing,
      attack: 0.05,
      gain: { start: 0.2, steps: [{ value: 0.8, time: 0.1 }], interpolation: 'linear' as const },
    }],
    ['linear envelope whose attack outlasts its first step', {
      ...timing,
      attack: 0.2,
      gain: { start: 0.2, steps: [{ value: 0.8, time: 0.1 }], interpolation: 'linear' as const },
    }],
    ['step envelope', {
      ...timing,
      attack: 0.05,
      gain: { start: 0.2, steps: [{ value: 0.8, time: 0.1 }, { value: 0.3, time: 0.25 }], interpolation: 'step' as const },
    }],
    ['scalar gain', { ...timing, attack: 0.05, gain: 0.6 }],
  ])('reports the gain playback schedules for a %s', (_, definition) => {
    const gain = playedGain(definition)

    for (const time of sampleTimes) {
      expect(sampleGainAtTime(definition, time), `at ${time}s`).toBeCloseTo(automatedValueAt(gain, time), 6)
    }
  })

  it('reaches a linear envelope\'s first step when the attack outlasts it, instead of jumping there', () => {
    const gain = playedGain({
      ...timing,
      attack: 0.2,
      gain: { start: 0.2, steps: [{ value: 0.8, time: 0.1 }], interpolation: 'linear' },
    })

    expect(automatedValueAt(gain, 0.0999)).toBeCloseTo(0.8, 2)
  })
})

describe('playSoundFromDefinition option validation', () => {
  it.each([
    ['a negative volume', { volume: -0.1 }],
    ['a NaN volume', { volume: Number.NaN }],
    ['a zero pitchScale', { pitchScale: 0 }],
    ['a negative pitchScale', { pitchScale: -1 }],
    ['an infinite pitchScale', { pitchScale: Infinity }],
  ])('throws RangeError for %s before touching the context', (_, options) => {
    const context = createMockAudioContext()

    expect(() => playSoundFromDefinition(context, { frequency: 440 }, options)).toThrow(RangeError)
    expect(context.createOscillator).not.toHaveBeenCalled()
  })

  it('floors a scaled frequency at the audible minimum', () => {
    const context = createMockAudioContext()

    playSoundFromDefinition(context, { frequency: 440 }, { pitchScale: 0.0001 })

    expect(context.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(1, 0)
  })
})

describe('stepped frequency scheduling', () => {
  it('jumps between steps with setValueAtTime instead of ramping', () => {
    const context = createMockAudioContext()

    playSoundFromDefinition(context, {
      frequency: { start: 440, steps: [{ value: 880, time: 0.1 }], interpolation: 'step' },
      duration: 0.3,
    })

    const { frequency } = context.oscillators[0]
    expect(frequency.setValueAtTime.mock.calls).toEqual([[440, 0], [880, 0.1]])
    expect(frequency.linearRampToValueAtTime).not.toHaveBeenCalled()
  })

  it('applies pitchScale to the start and every step', () => {
    const context = createMockAudioContext()

    playSoundFromDefinition(context, {
      frequency: { start: 440, steps: [{ value: 880, time: 0.1 }] },
      duration: 0.3,
    }, { pitchScale: 2 })

    const { frequency } = context.oscillators[0]
    expect(frequency.setValueAtTime).toHaveBeenCalledWith(880, 0)
    expect(frequency.linearRampToValueAtTime).toHaveBeenCalledWith(1760, 0.1)
  })
})

describe('stop fade', () => {
  it('fades the gain from its current level to silence over the stop window, then stops the oscillator', () => {
    const context = createMockAudioContext({ currentTime: 2 })
    const handle = playSoundFromDefinition(context, { frequency: 440, duration: 1 })
    const { gain } = context.gainNodes[0]
    const oscillator = context.oscillators[0]
    gain.value = 0.3
    gain.setValueAtTime.mockClear()

    handle.stop()

    expect(gain.cancelScheduledValues).toHaveBeenCalledWith(2)
    expect(gain.setValueAtTime).toHaveBeenCalledWith(0.3, 2)
    expect(gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0.0001, 2.005)
    expect(oscillator.stop).toHaveBeenLastCalledWith(2.006)
  })

  it('fades from the level the engine reported before the cancel truncated the envelope', () => {
    const context = createMockAudioContext({ currentTime: 2 })
    const handle = playSoundFromDefinition(context, { frequency: 440, duration: 1 })
    const { gain } = context.gainNodes[0]
    gain.value = 0.3
    // Engines may report the intrinsic value once the running ramp is cancelled
    gain.cancelScheduledValues.mockImplementation(() => {
      gain.value = 1
    })
    gain.setValueAtTime.mockClear()

    handle.stop()

    expect(gain.setValueAtTime).toHaveBeenCalledWith(0.3, 2)
  })

  it('holds the envelope where it is when the engine can cancel and hold', () => {
    const context = createMockAudioContext({ currentTime: 2 })
    const handle = playSoundFromDefinition(context, { frequency: 440, duration: 1 })
    const { gain } = context.gainNodes[0]
    const cancelAndHoldAtTime = vi.fn()
    Object.assign(gain, { cancelAndHoldAtTime })
    gain.setValueAtTime.mockClear()

    handle.stop()

    expect(cancelAndHoldAtTime).toHaveBeenCalledWith(2)
    expect(gain.cancelScheduledValues).not.toHaveBeenCalled()
    expect(gain.setValueAtTime).not.toHaveBeenCalled()
    expect(gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0.0001, 2.005)
  })

  it('settles the playback promise on stop', async () => {
    const context = createMockAudioContext()
    const handle = playSoundFromDefinition(context, { frequency: 440, duration: 1 })

    handle.stop()

    await expect(handle.promise).resolves.toBeUndefined()
  })

  it('ignores a second stop', () => {
    const context = createMockAudioContext()
    const handle = playSoundFromDefinition(context, { frequency: 440, duration: 1 })
    const { gain } = context.gainNodes[0]

    handle.stop()
    handle.stop()

    expect(gain.cancelScheduledValues).toHaveBeenCalledOnce()
  })

  it('still disconnects when the context rejects the fade', () => {
    const context = createMockAudioContext()
    const handle = playSoundFromDefinition(context, { frequency: 440, duration: 1 })
    const voiceGain = context.gainNodes[0]
    voiceGain.gain.cancelScheduledValues.mockImplementation(() => {
      throw new Error('closed')
    })

    handle.stop()

    expect(voiceGain.disconnect).toHaveBeenCalledOnce()
    expect(handle.isPlaying).toBe(false)
  })
})

describe('voice lifecycle', () => {
  it('settles the promise and releases the nodes when the oscillator ends on its own', async () => {
    const context = createMockAudioContext()
    const handle = playSoundFromDefinition(context, { frequency: 440, duration: 0.2 })
    const oscillator = context.oscillators[0]

    oscillator.onended?.()

    expect(handle.isPlaying).toBe(false)
    expect(oscillator.disconnect).toHaveBeenCalledOnce()
    await expect(handle.promise).resolves.toBeUndefined()
  })

  it('finishes through the fallback timer when onended never fires', () => {
    vi.useFakeTimers()
    try {
      const context = createMockAudioContext()
      const handle = playSoundFromDefinition(context, { frequency: 440, duration: 0.2 })

      vi.advanceTimersByTime(301)

      expect(handle.isPlaying).toBe(false)
      expect(context.gainNodes[0].disconnect).toHaveBeenCalledOnce()
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('reports a failed start and settles the handle', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const context = createMockAudioContext()
      // Built on a donor context so the mock-typed node is reachable
      const donor = createMockAudioContext()
      donor.createOscillator()
      const oscillator = donor.oscillators[0]
      oscillator.start.mockImplementation(() => {
        throw new Error('InvalidStateError')
      })
      context.createOscillator.mockReturnValueOnce(oscillator)

      const handle = playSoundFromDefinition(context, { frequency: 440, duration: 0.2 })

      expect(handle.isPlaying).toBe(false)
      expect(consoleError).toHaveBeenCalledOnce()
      await expect(handle.promise).resolves.toBeUndefined()
    }
    finally {
      consoleError.mockRestore()
    }
  })
})
