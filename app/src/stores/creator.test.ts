import { isValidSoundDefinition } from '@rjvr/buzzsaw'
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
