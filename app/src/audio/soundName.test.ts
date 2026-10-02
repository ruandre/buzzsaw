import { describe, expect, it } from 'vitest'
import { isValidSoundName, SOUND_NAME_PATTERN, toCustomSoundName } from './soundName'

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

describe('toCustomSoundName', () => {
  it('keeps a name no preset uses', () => {
    expect(toCustomSoundName('my_zap')).toBe('my_zap')
  })

  it('renames a preset name so the preset and its UI cue keep sounding', () => {
    expect(toCustomSoundName('pop')).toBe('pop_custom')
  })

  it('keeps suffixing a preset name until it avoids every taken name', () => {
    expect(toCustomSoundName('pop', new Set(['pop_custom']))).toBe('pop_custom_custom')
  })

  it('keeps a taken name no preset uses, so it can overwrite', () => {
    expect(toCustomSoundName('mine', new Set(['mine']))).toBe('mine')
  })

  it('ignores inherited object keys', () => {
    expect(toCustomSoundName('constructor')).toBe('constructor')
  })
})
