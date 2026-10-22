import { describe, expect, it } from 'vitest'
import { validateSoundDefinition } from './validation.js'

describe('validateSoundDefinition', () => {
  it('rejects a frequency that is neither a number nor an envelope', () => {
    expect(validateSoundDefinition({ frequency: '440' })).toEqual([
      'Frequency must be either a number or an object with start and steps.',
    ])
  })

  it('names the missing frequency', () => {
    expect(validateSoundDefinition({ gain: 0.5 })).toEqual([
      'Sound definition is missing required "frequency" property.',
    ])
  })

  it('accepts an explicit null gain as the default', () => {
    expect(validateSoundDefinition({ frequency: 440, gain: null })).toEqual([])
  })

  it('rejects gain steps that are not an array', () => {
    expect(validateSoundDefinition({ frequency: 440, gain: { start: 0.5, steps: 'loud' } })).toEqual([
      'Gain steps must be an array.',
    ])
  })

  it('rejects an unknown key inside a frequency step, naming the key and the step index', () => {
    const errors = validateSoundDefinition({
      frequency: { start: 440, steps: [{ value: 220, time: 0.1 }, { value: 110, time: 0.2, curve: 'exp' }] },
    })

    expect(errors).toEqual([
      'Unknown frequency step at index 1 property "curve". Expected one of: value, time',
    ])
  })

  it('rejects an unknown key inside a gain step, naming the key and the step index', () => {
    const errors = validateSoundDefinition({ frequency: 440, gain: { start: 0.5, steps: [{ value: 0, time: 0.1, curve: 'exp' }] } })

    expect(errors).toEqual([
      'Unknown gain step at index 0 property "curve". Expected one of: value, time',
    ])
  })

  it('points interpolation set on a step to the envelope', () => {
    const errors = validateSoundDefinition({
      frequency: { start: 440, steps: [{ value: 220, time: 0.1, interpolation: 'linear' }] },
    })

    expect(errors).toEqual([
      'Unknown frequency step at index 0 property "interpolation". Expected one of: value, time. Set interpolation on the envelope, not on a step',
    ])
  })

  it('accepts steps holding only value and time', () => {
    const errors = validateSoundDefinition({
      frequency: { start: 440, steps: [{ value: 220, time: 0.1 }], interpolation: 'linear' },
      gain: { start: 0.5, steps: [{ value: 0, time: 0.2 }] },
    })

    expect(errors).toEqual([])
  })

  it('rejects an unknown key inside a gain envelope', () => {
    const errors = validateSoundDefinition({ frequency: 440, gain: { start: 0.5, steps: [], curve: 'exp' } })

    expect(errors).toEqual([
      'Unknown gain envelope property "curve". Expected one of: start, steps, interpolation',
    ])
  })

  it('rejects an interpolation outside linear and step', () => {
    const errors = validateSoundDefinition({
      frequency: { start: 440, steps: [], interpolation: 'exponential' },
    })

    expect(errors).toEqual([
      'Invalid frequency interpolation "exponential". Expected one of: linear, step',
    ])
  })

  it.each([
    ['null', null],
    ['a number', 0.5],
    ['a step with a NaN value', { value: Number.NaN, time: 0.1 }],
    ['a step with a string time', { value: 0.5, time: '0.1' }],
  ])('reports a malformed step (%s) by index', (_, step) => {
    const errors = validateSoundDefinition({ frequency: 440, gain: { start: 0.5, steps: [{ value: 0.4, time: 0 }, step] } })

    expect(errors).toEqual([
      'Gain step at index 1 is malformed. Expected { value: number, time: number }.',
    ])
  })

  it.each([
    ['duration', { duration: Number.NaN }, 'Invalid duration: NaN. Must be a finite number of at least 0.01.'],
    ['duration', { duration: '0.5' }, 'Invalid duration: 0.5. Must be a finite number of at least 0.01.'],
    ['attack', { attack: Infinity }, 'Invalid attack: Infinity. Must be a non-negative number.'],
    ['decay', { decay: Number.NaN }, 'Invalid decay: NaN. Must be a non-negative number.'],
  ])('rejects a non-finite %s', (_, timing, message) => {
    expect(validateSoundDefinition({ frequency: 440, ...timing })).toEqual([message])
  })

  it('accumulates every error rather than stopping at the first', () => {
    const errors = validateSoundDefinition({
      waveType: 'noise',
      frequency: -1,
      gain: 2,
      duration: 0,
    })

    expect(errors).toHaveLength(4)
    expect(errors.join('\n')).toMatch(/waveType/)
    expect(errors.join('\n')).toMatch(/frequency number/)
    expect(errors.join('\n')).toMatch(/gain number/)
    expect(errors.join('\n')).toMatch(/duration/)
  })
})
