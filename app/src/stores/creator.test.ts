import type { SoundDefinition } from '@rjvr/buzzsaw'
import { DEFAULT_ATTACK_S, DEFAULT_DECAY_S, DEFAULT_DURATION_S, isValidSoundDefinition } from '@rjvr/buzzsaw'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { CREATOR_LIMITS, useCreatorStore } from './creator'

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

describe('creator store envelope timing', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('clamps attack and decay to a shortened duration so the editor shows what plays', async () => {
    const creator = useCreatorStore()
    creator.state.duration = 1
    creator.state.attack = 0.4
    creator.state.decay = 0.5

    creator.state.duration = 0.3
    await nextTick()

    expect(creator.state.attack).toBe(0.3)
    expect(creator.state.decay).toBe(0)
  })

  it('bounds the attack by the duration and the decay by what the attack leaves', () => {
    const creator = useCreatorStore()
    creator.state.duration = 0.2
    creator.state.attack = 0.05

    expect(creator.attackMax).toBe(0.2)
    expect(creator.decayMax).toBeCloseTo(0.15)
  })

  it('bounds the attack and decay by their limits on a long sound', () => {
    const creator = useCreatorStore()
    creator.state.duration = 2.5
    creator.state.attack = 0.1

    expect(creator.attackMax).toBe(CREATOR_LIMITS.attack.max)
    expect(creator.decayMax).toBe(CREATOR_LIMITS.decay.max)
  })
})

describe('creator store step edits', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('edits a pitch step in place, keeping the row identity its editor keys on', () => {
    const creator = useCreatorStore()
    creator.state.frequencySteps = [{ value: 440, time: 0.1 }]
    const [step] = creator.state.frequencySteps

    creator.updateFrequencyStep(0, { value: 880 })

    expect(creator.state.frequencySteps).toEqual([{ value: 880, time: 0.1 }])
    expect(creator.state.frequencySteps[0]).toBe(step)
  })

  it('edits a gain step time', () => {
    const creator = useCreatorStore()
    creator.state.gainSteps = [{ value: 0.5, time: 0.1 }]

    creator.updateGainStep(0, { time: 0.3 })

    expect(creator.state.gainSteps).toEqual([{ value: 0.5, time: 0.3 }])
  })

  it('ignores an edit to a step that no longer exists', () => {
    const creator = useCreatorStore()
    creator.state.gainSteps = []

    creator.updateGainStep(2, { value: 0.5 })

    expect(creator.state.gainSteps).toEqual([])
  })
})
