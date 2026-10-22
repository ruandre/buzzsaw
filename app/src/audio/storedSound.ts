import type { SoundDefinition } from '@rjvr/buzzsaw'
import { cloneSoundDefinition, isValidSoundDefinition } from '@rjvr/buzzsaw'

/** Keeps only keys a current save writes, so stray keys in older saves are stripped rather than failing validation */
export function restoreSoundDefinition(stored: unknown): SoundDefinition | null {
  const copy = copyStoredDefinition(stored)
  return copy && isValidSoundDefinition(copy) ? copy : null
}

function copyStoredDefinition(stored: unknown): SoundDefinition | null {
  if (!stored || typeof stored !== 'object') {
    return null
  }
  try {
    return cloneSoundDefinition(stored as SoundDefinition)
  }
  // Malformed parts such as a null step throw while copying; validation would reject them anyway
  catch {
    return null
  }
}
