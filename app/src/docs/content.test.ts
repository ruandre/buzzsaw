import { describe, expect, it } from 'vitest'
import { toCustomSoundName } from '../audio/soundName'
import { DOC_EXAMPLES } from './content'

describe('documentation examples', () => {
  it.each(DOC_EXAMPLES.map(example => example.name))('plays %s without replacing a preset', (name) => {
    expect(toCustomSoundName(name)).toBe(name)
  })
})
