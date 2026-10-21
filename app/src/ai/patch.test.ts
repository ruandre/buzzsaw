import { validateSoundDefinition } from '@rjvr/buzzsaw'
import { describe, expect, it } from 'vitest'
import { normalizeSoundPatch, parseSoundPatch } from './patch'

const VALID = '{"name":"blip","description":"A blip.","waveType":"square","frequency":880,"duration":0.2}'

describe('parseSoundPatch', () => {
  it('parses a bare JSON object', () => {
    expect(parseSoundPatch(VALID).definition).toMatchObject({ waveType: 'square', frequency: 880 })
  })

  it('strips a markdown code fence around the JSON', () => {
    expect(parseSoundPatch(`\`\`\`json\n${VALID}\n\`\`\``).name).toBe('blip')
  })

  it('isolates the JSON object from surrounding prose', () => {
    expect(parseSoundPatch(`Here is your sound:\n${VALID}\nEnjoy!`).name).toBe('blip')
  })

  it('throws when the output holds no JSON object', () => {
    expect(() => parseSoundPatch('Sorry, I cannot do that.')).toThrow(/no JSON object/)
  })

  it('throws when the JSON is malformed', () => {
    expect(() => parseSoundPatch('{"name": "blip", "frequency": }')).toThrow(/malformed JSON/)
  })
})

describe('normalizeSoundPatch', () => {
  it('rejects a non-object candidate', () => {
    expect(() => normalizeSoundPatch('blip')).toThrow(TypeError)
    expect(() => normalizeSoundPatch(null)).toThrow(TypeError)
  })

  it('clamps scalar fields into generative limits', () => {
    const { definition } = normalizeSoundPatch({ frequency: 50000, gain: 1, duration: 9 })

    expect(definition).toMatchObject({ frequency: 10000, gain: 0.8, duration: 2.5 })
  })

  it('keeps attack and decay inside the duration', () => {
    const { definition } = normalizeSoundPatch({ frequency: 440, duration: 0.1, attack: 0.4, decay: 1.5 })

    expect(definition.attack).toBeCloseTo(0.08)
    expect(definition.decay).toBeCloseTo(0.02)
  })

  it('falls back to defaults for missing or non-numeric fields', () => {
    const { definition } = normalizeSoundPatch({ frequency: 'high', gain: null })

    expect(definition).toMatchObject({ waveType: 'sine', frequency: 440, gain: 0.4, duration: 0.3 })
  })

  it('collapses an envelope without usable steps to its start value', () => {
    const { definition } = normalizeSoundPatch({ frequency: { start: 660, steps: [null, { value: 'x', time: 0.1 }] } })

    expect(definition.frequency).toBe(660)
  })

  it('sorts envelope steps and clamps their times into the sound', () => {
    const { definition } = normalizeSoundPatch({
      duration: 0.5,
      frequency: { start: 440, steps: [{ value: 880, time: 9 }, { value: 220, time: -1 }] },
    })

    expect(definition.frequency).toEqual({ start: 440, steps: [{ value: 220, time: 0.001 }, { value: 880, time: 0.5 }] })
  })

  it('case-folds a known wave type and replaces an unknown one with sine', () => {
    expect(normalizeSoundPatch({ waveType: 'SQUARE', frequency: 440 }).definition.waveType).toBe('square')
    expect(normalizeSoundPatch({ waveType: 'noise', frequency: 440 }).definition.waveType).toBe('sine')
  })

  it('drops a custom wave with no audible partials back to sine', () => {
    const { definition } = normalizeSoundPatch({ waveType: 'custom', partials: [0, 0], frequency: 440 })

    expect(definition.waveType).toBe('sine')
    expect(definition.partials).toBeUndefined()
  })

  it('keeps at most eight partials, clamped to the unit range', () => {
    const { definition } = normalizeSoundPatch({
      waveType: 'custom',
      partials: [2, 1, 0.5, 0.25, 0.125, 0.0625, 0.03, 0.015, 0.007, 0.003],
      frequency: 440,
    })

    expect(definition.partials).toEqual([1, 1, 0.5, 0.25, 0.125, 0.0625, 0.03, 0.015])
  })

  it('strips unsafe characters from the name and invents one when nothing is left', () => {
    expect(normalizeSoundPatch({ name: ' La ser!! ', frequency: 440 }).name).toBe('Laser')
    expect(normalizeSoundPatch({ name: '!!!', waveType: 'square', frequency: 440 }).name).toMatch(/^ai_square_\d+$/)
  })

  it('describes the patch when the model gives no description', () => {
    expect(normalizeSoundPatch({ frequency: 440 }).description).toBe('Synthesized sine tone at 440 Hz.')
    expect(normalizeSoundPatch({ frequency: { start: 440, steps: [{ value: 880, time: 0.1 }] } }).description)
      .toBe('Synthesized sine tone at modulated pitch.')
  })

  it('always yields a definition the library accepts', () => {
    const garbage = [
      {},
      { frequency: -1, gain: -1, duration: -1, attack: -1, decay: -1 },
      { frequency: Infinity, gain: Number.NaN, duration: Number.NaN },
      { waveType: 'custom', partials: 'many', frequency: 1 },
      { frequency: { start: 0, steps: [{ value: 0, time: 0 }] }, gain: { start: 9, steps: [{ value: 9, time: 9 }] } },
    ]

    for (const candidate of garbage) {
      expect(validateSoundDefinition(normalizeSoundPatch(candidate).definition)).toEqual([])
    }
  })
})
