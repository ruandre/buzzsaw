import { describe, expect, it, vi } from 'vitest'
import { applyWaveShape, evaluateWaveShape, resolvePartials } from './oscillator'
import { createMockAudioContext } from './testing/mockAudioContext'

describe('resolvePartials', () => {
  it('reads partials only for a custom wave', () => {
    expect(resolvePartials({ frequency: 440, waveType: 'custom', partials: [1, 0.5] })).toEqual([1, 0.5])
    expect(resolvePartials({ frequency: 440, waveType: 'sine', partials: [1, 0.5] })).toBeNull()
  })

  it('rejects a series that describes no sound', () => {
    expect(resolvePartials({ frequency: 440, waveType: 'custom', partials: [] })).toBeNull()
    expect(resolvePartials({ frequency: 440, waveType: 'custom', partials: [0, 0] })).toBeNull()
  })

  it('drops non-finite amplitudes that would make createPeriodicWave throw', () => {
    const partials = resolvePartials({
      frequency: 440,
      waveType: 'custom',
      partials: [1, Number.NaN, 0.5, Number.POSITIVE_INFINITY],
    })
    expect(partials).toEqual([1, 0.5])
  })

  it('caps the series so a huge import cannot stall the audio thread', () => {
    const partials = resolvePartials({
      frequency: 440,
      waveType: 'custom',
      partials: Array.from({ length: 500 }).fill(1),
    })
    expect(partials).toHaveLength(64)
  })
})

describe('applyWaveShape', () => {
  it('builds a periodic wave from partials, leaving the fundamental bin empty', () => {
    const ctx = createMockAudioContext()
    const oscillator = ctx.createOscillator()

    applyWaveShape(ctx, oscillator, { frequency: 440, waveType: 'custom', partials: [1, 0.5] })

    expect(ctx.createPeriodicWave).toHaveBeenCalledTimes(1)
    const [real, imag] = vi.mocked(ctx.createPeriodicWave).mock.calls[0]
    expect(Array.from(real)).toEqual([0, 0, 0])
    expect(Array.from(imag)).toEqual([0, 1, 0.5])
    expect(oscillator.setPeriodicWave).toHaveBeenCalled()
  })

  it('never assigns type "custom", which the oscillator rejects outright', () => {
    const ctx = createMockAudioContext()
    const oscillator = ctx.createOscillator()

    applyWaveShape(ctx, oscillator, { frequency: 440, waveType: 'custom' })

    expect(oscillator.type).toBe('sine')
    expect(ctx.createPeriodicWave).not.toHaveBeenCalled()
  })

  it('passes the built-in shapes straight through', () => {
    const ctx = createMockAudioContext()
    const oscillator = ctx.createOscillator()

    applyWaveShape(ctx, oscillator, { frequency: 440, waveType: 'sawtooth' })

    expect(oscillator.type).toBe('sawtooth')
  })
})

describe('evaluateWaveShape', () => {
  it('draws each built-in shape within unit range', () => {
    for (const waveType of ['sine', 'square', 'sawtooth', 'triangle'] as const) {
      for (let phase = 0; phase < 8; phase += 0.37) {
        const value = evaluateWaveShape({ frequency: 440, waveType }, phase)
        expect(value).toBeGreaterThanOrEqual(-1)
        expect(value).toBeLessThanOrEqual(1)
      }
    }
  })

  it('normalises a harmonic series to unit peak, as PeriodicWave does', () => {
    const def = { frequency: 440, waveType: 'custom' as const, partials: [3, 3] }
    for (let phase = 0; phase < 8; phase += 0.13) {
      expect(Math.abs(evaluateWaveShape(def, phase))).toBeLessThanOrEqual(1)
    }
  })

  it('reduces a single fundamental partial to a sine', () => {
    const def = { frequency: 440, waveType: 'custom' as const, partials: [1] }
    expect(evaluateWaveShape(def, Math.PI / 2)).toBeCloseTo(1)
    expect(evaluateWaveShape(def, 0)).toBeCloseTo(0)
  })
})
