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

function isPresetName(name: string): boolean {
  return Object.hasOwn(DEFAULT_SOUNDS, name)
}

/**
 * Name a user sound can take without replacing a built-in preset, which also voices the UI cues
 *
 * Renamed preset names also avoid `taken`; any other name is kept even if taken, so it overwrites
 */
export function toCustomSoundName(name: string, taken: ReadonlySet<string> = new Set()): string {
  if (!isPresetName(name)) {
    return name
  }
  let candidate = name + CUSTOM_SUFFIX
  while (isPresetName(candidate) || taken.has(candidate)) {
    candidate += CUSTOM_SUFFIX
  }
  return candidate
}
