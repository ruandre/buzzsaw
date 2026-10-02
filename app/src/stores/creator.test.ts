import type { SoundDefinition } from '@rjvr/buzzsaw'
import { DEFAULT_ATTACK_S, DEFAULT_DECAY_S, DEFAULT_DURATION_S, isValidSoundDefinition } from '@rjvr/buzzsaw'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useCreatorStore } from './creator'

describe('creator store definition', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('caps a typed fixed gain at full scale', () => {
    const creator = useCreatorStore()
    creator.state.fixedGain = 2

    expect(creator.definition.gain).toBe(1)
    expect(isValidSoundDefinition(creator.definition)).toBe(true)
  })

  it('caps typed gain envelope levels at full scale', () => {
    const creator = useCreatorStore()
    creator.state.gainMode = 'steps'
    creator.state.gainStart = 3
    creator.state.gainSteps = [{ value: 2, time: 0.1 }]

    expect(creator.definition.gain).toEqual({ start: 1, steps: [{ value: 1, time: 0.1 }] })
    expect(isValidSoundDefinition(creator.definition)).toBe(true)
  })
})

describe('creator store load', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('compiles an untouched sound back to its source with core timing defaults', () => {
    const creator = useCreatorStore()
    const source: SoundDefinition = {
      waveType: 'sine',
      frequency: 15000,
      gain: { start: 0.5, steps: [{ value: 0.2, time: 0.1 }], interpolation: 'linear' },
    }

    creator.load('bright', source)

    expect(creator.definition).toStrictEqual({
      ...source,
      duration: DEFAULT_DURATION_S,
      attack: DEFAULT_ATTACK_S,
      decay: DEFAULT_DECAY_S,
    })
  })

  it('compiles an untouched frequency envelope back to its source', () => {
    const creator = useCreatorStore()
    const source: SoundDefinition = {
      waveType: 'square',
      frequency: { start: 12000, steps: [{ value: 18000, time: 0.1 }], interpolation: 'step' },
      gain: { start: 0.5, steps: [{ value: 0.2, time: 0.1 }] },
      duration: 0.3,
      attack: 0.02,
      decay: 0.1,
    }

    creator.load('chirp', source)

    expect(creator.definition).toStrictEqual(source)
  })

  it('keeps a custom timbre whose partials are all phase-inverted', () => {
    const creator = useCreatorStore()
    const source: SoundDefinition = { waveType: 'custom', partials: [-1, 0, -0.3], frequency: 440 }

    creator.load('inverted', source)

    expect(creator.definition).toMatchObject({ waveType: 'custom', partials: [-1, 0, -0.3] })
  })
})
