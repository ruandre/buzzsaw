import type { SoundDefinition } from './types.js'
import { describe, expect, it } from 'vitest'
import {
  calculateEffectiveDuration,
  cloneSoundDefinition,
  isValidSoundDefinition,
  sampleFrequencyAtTime,
  sampleGainAtTime,
} from './utils.js'

describe('sounds utils', () => {
  describe('cloneSoundDefinition', () => {
    it('creates a deep, independent copy of a definition', () => {
      const original = {
        attack: 0.01,
        decay: 0.1,
        duration: 0.3,
        frequency: {
          start: 440,
          steps: [{ time: 0.1, value: 880 }],
        },
        gain: {
          start: 0.5,
          steps: [{ time: 0.1, value: 0.2 }],
        },
        waveType: 'sine' as OscillatorType,
      }

      const cloned = cloneSoundDefinition(original)
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned.frequency).not.toBe(original.frequency)
      expect(cloned.gain).not.toBe(original.gain)

      if (typeof cloned.frequency === 'object') {
        cloned.frequency.steps[0].value = 1000
      }
      expect((original.frequency as any).steps[0].value).toBe(880)
    })

    it('handles fixed frequency and gain numbers', () => {
      const original = {
        frequency: 440,
        gain: 0.4,
        waveType: 'square' as OscillatorType,
      }

      const cloned = cloneSoundDefinition(original)
      expect(cloned).toEqual(original)
    })

    it('throws when passed non-object', () => {
      expect(() => cloneSoundDefinition(null as any)).toThrow(TypeError)
    })
  })

  describe('calculateEffectiveDuration', () => {
    it('returns nominal duration when larger than step times', () => {
      const def = {
        duration: 0.6,
        frequency: {
          start: 440,
          steps: [{ time: 0.2, value: 880 }],
        },
      }
      expect(calculateEffectiveDuration(def)).toBe(0.6)
    })

    it('extends duration to accommodate envelope step times', () => {
      const def = {
        duration: 0.3,
        frequency: {
          start: 440,
          steps: [{ time: 0.8, value: 880 }],
        },
      }
      expect(calculateEffectiveDuration(def)).toBe(0.81)
    })

    it('checks gain step times as well', () => {
      const def = {
        frequency: 440,
        gain: {
          start: 0.5,
          steps: [{ time: 1.2, value: 0.01 }],
        },
      }
      expect(calculateEffectiveDuration(def)).toBe(1.21)
    })

    it('returns default 0.5 for empty / fallback cases', () => {
      expect(calculateEffectiveDuration({ frequency: 440 })).toBe(0.5)
      expect(calculateEffectiveDuration(null as any)).toBe(0.5)
    })
  })

  describe('sampleFrequencyAtTime', () => {
    it('returns constant value for fixed frequency', () => {
      const def = { frequency: 520 }
      expect(sampleFrequencyAtTime(def, 0)).toBe(520)
      expect(sampleFrequencyAtTime(def, 0.5)).toBe(520)
    })

    it('interpolates linearly between frequency steps', () => {
      const def = {
        frequency: {
          start: 400,
          steps: [
            { time: 0.1, value: 600 },
            { time: 0.2, value: 800 },
          ],
        },
      }

      expect(sampleFrequencyAtTime(def, 0)).toBe(400)
      expect(sampleFrequencyAtTime(def, 0.05)).toBeCloseTo(500, 1)
      expect(sampleFrequencyAtTime(def, 0.1)).toBe(600)
      expect(sampleFrequencyAtTime(def, 0.15)).toBeCloseTo(700, 1)
      expect(sampleFrequencyAtTime(def, 0.2)).toBe(800)
      expect(sampleFrequencyAtTime(def, 0.5)).toBe(800)
    })

    it('falls back safely on invalid frequency inputs', () => {
      expect(sampleFrequencyAtTime(null as any, 0)).toBe(440)
      expect(sampleFrequencyAtTime({ frequency: 'invalid' as any }, 0)).toBe(440)
    })
  })

  describe('sampleGainAtTime', () => {
    it('calculates fixed gain attack, sustain, and decay envelope', () => {
      const def = {
        attack: 0.02,
        decay: 0.05,
        duration: 0.2,
        frequency: 440,
        gain: 0.8,
      }

      expect(sampleGainAtTime(def, 0)).toBe(0)
      expect(sampleGainAtTime(def, 0.01)).toBeCloseTo(0.4, 2)
      expect(sampleGainAtTime(def, 0.02)).toBeCloseTo(0.8, 2)
      expect(sampleGainAtTime(def, 0.10)).toBeCloseTo(0.8, 2)
      expect(sampleGainAtTime(def, 0.175)).toBeCloseTo(0.4, 2)
      expect(sampleGainAtTime(def, 0.2)).toBe(0)
      expect(sampleGainAtTime(def, 0.25)).toBe(0)
    })

    it('holds each gain step until the next one', () => {
      const def = {
        duration: 0.3,
        frequency: 440,
        gain: {
          start: 0.2,
          steps: [{ time: 0.1, value: 0.6 }],
        },
      }

      expect(sampleGainAtTime(def, 0)).toBe(0.2)
      expect(sampleGainAtTime(def, 0.05)).toBe(0.2)
      expect(sampleGainAtTime(def, 0.099)).toBe(0.2)
      expect(sampleGainAtTime(def, 0.1)).toBe(0.6)
    })

    it('gates hard between an on step and an off step', () => {
      const def = {
        duration: 0.4,
        frequency: 440,
        gain: {
          start: 0.001,
          steps: [
            { time: 0.01, value: 0.5 },
            { time: 0.1, value: 0.001 },
            { time: 0.2, value: 0.5 },
          ],
        },
      }

      expect(sampleGainAtTime(def, 0.05)).toBe(0.5)
      expect(sampleGainAtTime(def, 0.15)).toBe(0.001)
      expect(sampleGainAtTime(def, 0.21)).toBe(0.5)
    })
  })

  describe('isValidSoundDefinition', () => {
    it('returns true for valid definitions', () => {
      expect(isValidSoundDefinition({ frequency: 440 })).toBe(true)
      expect(isValidSoundDefinition({
        attack: 0.01,
        decay: 0.1,
        duration: 0.2,
        frequency: { start: 440, steps: [{ time: 0.1, value: 880 }] },
        gain: 0.5,
        waveType: 'sine',
      })).toBe(true)
    })

    it('returns false for invalid inputs', () => {
      expect(isValidSoundDefinition(null)).toBe(false)
      expect(isValidSoundDefinition({})).toBe(false)
      expect(isValidSoundDefinition({ frequency: -10 })).toBe(false)
      expect(isValidSoundDefinition({ frequency: 440, waveType: 'invalid' })).toBe(false)
    })
  })

  describe('envelope interpolation', () => {
    it('holds gain between steps but glides frequency, by default', () => {
      const def: SoundDefinition = {
        duration: 1,
        frequency: { start: 100, steps: [{ time: 1, value: 200 }] },
        gain: { start: 0.2, steps: [{ time: 1, value: 0.8 }] },
      }

      expect(sampleFrequencyAtTime(def, 0.5)).toBeCloseTo(150)
      expect(sampleGainAtTime(def, 0.5, 1)).toBeCloseTo(0.2)
    })

    it('lets a definition override either default', () => {
      const def: SoundDefinition = {
        duration: 1,
        frequency: { start: 100, steps: [{ time: 1, value: 200 }], interpolation: 'step' },
        gain: { start: 0.2, steps: [{ time: 1, value: 0.8 }], interpolation: 'linear' },
      }

      expect(sampleFrequencyAtTime(def, 0.5)).toBeCloseTo(100)
      expect(sampleGainAtTime(def, 0.5, 1)).toBeCloseTo(0.5)
    })
  })

  describe('duration arithmetic', () => {
    it('carves attack and decay out of duration rather than adding to it', () => {
      expect(calculateEffectiveDuration({ frequency: 440, duration: 0.2, decay: 0.5 })).toBe(0.2)
      expect(calculateEffectiveDuration({ frequency: 440, duration: 0.2, attack: 0.4 })).toBe(0.2)
    })

    it('extends duration to cover envelope steps that run past it', () => {
      expect(calculateEffectiveDuration({
        frequency: { start: 440, steps: [{ time: 2, value: 880 }] },
        duration: 0.2,
      })).toBeCloseTo(2.01)
    })
  })
})
