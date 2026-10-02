import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'

// Escaped hyphen is required because HTML pattern attribute compiles with RegExp 'v' flag
export const SOUND_NAME_PATTERN = '[\\w \\-]+'

export const SOUND_NAME_RULE = 'Letters, numbers, spaces, hyphens, and underscores only.'

// eslint-disable-next-line regexp/no-useless-non-capturing-group
const SOUND_NAME_RE = new RegExp(`^(?:${SOUND_NAME_PATTERN})$`, 'v')

export function isValidSoundName(name: string): boolean {
  return SOUND_NAME_RE.test(name)
}

const CUSTOM_SUFFIX = '_custom'

/** Name a user sound can take without replacing a built-in preset, which also voices the UI cues */
export function toCustomSoundName(name: string): string {
  let candidate = name
  while (Object.hasOwn(DEFAULT_SOUNDS, candidate)) {
    candidate += CUSTOM_SUFFIX
  }
  return candidate
}
