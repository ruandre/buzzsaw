import { describe, expect, it } from 'vitest'
import { validateSoundDefinition } from './soundPlayer'
import { DEFAULT_SOUNDS } from './sounds'

describe('dEFAULT_SOUNDS presets registry', () => {
  it('contains a rich library of default sound presets', () => {
    const soundNames = Object.keys(DEFAULT_SOUNDS)
    expect(soundNames.length).toBeGreaterThanOrEqual(70)
  })

  it('all sound definitions in DEFAULT_SOUNDS are valid and error-free', () => {
    for (const [name, definition] of Object.entries(DEFAULT_SOUNDS)) {
      const errors = validateSoundDefinition(definition)
      expect(
        errors,
        `Sound "${name}" had validation errors: ${errors.join(', ')}`,
      ).toEqual([])
    }
  })

  it('all step envelopes are sorted and positive', () => {
    for (const [name, def] of Object.entries(DEFAULT_SOUNDS)) {
      if (typeof def.frequency === 'object' && def.frequency && 'steps' in def.frequency) {
        let lastTime = 0
        for (const step of def.frequency.steps) {
          expect(step.time).toBeGreaterThanOrEqual(0)
          expect(step.value).toBeGreaterThan(0)
          expect(step.time, `Sound "${name}" frequency step time should be non-decreasing`).toBeGreaterThanOrEqual(lastTime)
          lastTime = step.time
        }
      }

      if (typeof def.gain === 'object' && def.gain && 'steps' in def.gain) {
        let lastTime = 0
        for (const step of def.gain.steps) {
          expect(step.time).toBeGreaterThanOrEqual(0)
          expect(step.value).toBeGreaterThanOrEqual(0)
          expect(step.time, `Sound "${name}" gain step time should be non-decreasing`).toBeGreaterThanOrEqual(lastTime)
          lastTime = step.time
        }
      }
    }
  })

  it('duration is greater than zero when specified', () => {
    for (const [name, def] of Object.entries(DEFAULT_SOUNDS)) {
      if (def.duration !== undefined) {
        expect(def.duration, `Sound "${name}" duration should be > 0`).toBeGreaterThan(0)
      }
    }
  })
})
