import { validateSoundDefinition } from '@rjvr/buzzsaw'
import { airRaidSiren } from '@rjvr/buzzsaw/sounds'
import { describe, expect, it } from 'vitest'
import { redesignSound } from '.'

describe('redesignSound', () => {
  it('returns a valid definition when an offline edit would exceed core limits', async () => {
    const edited = await redesignSound({ frequency: 16000 }, 'whistle', 'arpeggio')

    expect(edited.source).toBe('offline')
    expect(validateSoundDefinition(edited.definition)).toEqual([])
  })

  it('keeps a valid offline edit beyond generative limits intact', async () => {
    const edited = await redesignSound(airRaidSiren, 'airRaidSiren', 'square')

    expect(edited.source).toBe('offline')
    expect(edited.definition.duration).toBe(3.4)
  })
})
