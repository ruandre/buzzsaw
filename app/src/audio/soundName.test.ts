import { describe, expect, it } from 'vitest'
import { isValidSoundName, SOUND_NAME_PATTERN } from './soundName'

describe('isValidSoundName', () => {
  it.each(['ding', 'laser_shot', 'my sound', 'retro-jump', 'a1'])('accepts %s', (name) => {
    expect(isValidSoundName(name)).toBe(true)
  })

  it.each(['', 'has.dot', 'slash/es', 'star*', 'emoji🎵'])('rejects %s', (name) => {
    expect(isValidSoundName(name)).toBe(false)
  })

  it('anchors the whole name, not a substring', () => {
    expect(isValidSoundName('ok!then')).toBe(false)
  })

  // Verifies pattern compiles under RegExp 'v' flag used by HTML pattern attribute
  it('compiles under the RegExp v flag the browser uses for `pattern`', () => {
    expect(() => new RegExp(`^(?:${SOUND_NAME_PATTERN})$`, 'v')).not.toThrow()
  })
})
