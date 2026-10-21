import type { SoundDefinition, SoundPack } from '@rjvr/buzzsaw'
import { cloneSoundDefinition, isValidSoundDefinition, validateSoundDefinition } from '@rjvr/buzzsaw'
import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { isValidSoundName, SOUND_NAME_RULE, toCustomSoundName } from '../audio/soundName'
import { downloadJson } from '../utils/download'
import { forEachYielding } from '../utils/scheduler'
import { isSafeKey, safeRecordEntries, STORAGE_KEYS, usePersistedState } from '../utils/storage'
import { useNotificationsStore } from './notifications'
import { usePlaybackStore } from './playback'

export interface ImportResult {
  imported: number
  /** Malformed or unsafe entries skipped during import */
  skipped: number
}

const SOUND_PACK_VERSION = 1

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export const useLibraryStore = defineStore('library', () => {
  const notifications = useNotificationsStore()
  const playback = usePlaybackStore()

  const customSounds = usePersistedState<Record<string, SoundDefinition>>(
    STORAGE_KEYS.customSounds,
    {},
    sanitizeSoundMap,
  )
  const favorites = usePersistedState<string[]>(
    STORAGE_KEYS.favorites,
    [],
    raw => (Array.isArray(raw) ? raw.filter(name => typeof name === 'string') : []),
  )

  const customSoundCount = computed(() => Object.keys(customSounds.value).length)
  const hasCustomSounds = computed(() => customSoundCount.value > 0)

  // Persisted sounds must be registered before any playback call
  registerAll(customSounds.value)

  function isFavorite(name: string): boolean {
    return favorites.value.includes(name)
  }

  function toggleFavorite(name: string): void {
    const starred = isFavorite(name)
    playback.cue(starred ? 'starOff' : 'starOn')
    favorites.value = starred
      ? favorites.value.filter(favorite => favorite !== name)
      : [...favorites.value, name]
    notifications.announce(
      starred ? `Unstarred "${name}"` : `Starred "${name}"`,
      'info',
      'polite',
      2000,
    )
  }

  /** Saves under the trimmed name, overwriting an existing entry; returns that name, or null if the name or definition is invalid */
  function save(name: string, definition: SoundDefinition): string | null {
    const requestedName = name.trim() || 'unnamed_sound'
    const soundName = toCustomSoundName(requestedName)
    const error = findSaveError(requestedName, definition)
    if (error !== undefined) {
      playback.cue('error')
      notifications.reportError(`Could not save "${soundName}": ${error}`)
      return null
    }

    const stored = cloneSoundDefinition(definition)
    playback.soundManager.register(soundName, stored)
    customSounds.value = { ...customSounds.value, [soundName]: stored }
    playback.cue('save')
    notifications.confirm(soundName === requestedName
      ? `Saved "${soundName}" to your library`
      : `Saved as "${soundName}"; "${requestedName}" is a built-in preset`)
    return soundName
  }

  /** Saves a copy of a library sound under the first free `_copy` name; returns it, or null if `name` is not in the library */
  function duplicate(name: string): string | null {
    if (!Object.hasOwn(customSounds.value, name)) {
      return null
    }
    return save(nextCopyName(name, Object.keys(customSounds.value)), customSounds.value[name])
  }

  function remove(name: string): void {
    const { [name]: removed, ...rest } = customSounds.value
    if (!removed) {
      return
    }
    customSounds.value = rest
    playback.soundManager.unregister(name)
    playback.cue('discard')
    notifications.announce(`Deleted "${name}"`, 'info', 'polite')
  }

  function clear(): void {
    for (const name of Object.keys(customSounds.value)) {
      playback.soundManager.unregister(name)
    }
    customSounds.value = {}
    playback.cue('undo')
    notifications.announce('Cleared your saved sounds', 'info', 'polite')
  }

  /** Also triggers a JSON file download */
  function exportPack(): SoundPack {
    const pack: SoundPack = {
      version: SOUND_PACK_VERSION,
      exportedAt: new Date().toISOString(),
      sounds: customSounds.value,
    }
    downloadJson(pack, `buzzsaw-sounds-${new Date().toISOString().slice(0, 10)}.json`)
    playback.cue('export')
    notifications.confirm(`Exported ${plural(customSoundCount.value, 'sound')}`)
    return pack
  }

  /** Accepts a SoundPack or a bare definition record; throws if the JSON is invalid or holds no valid definition */
  async function importPack(json: string): Promise<ImportResult> {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    }
    catch {
      playback.cue('error')
      notifications.reportError('That file is not valid JSON.')
      throw new Error('That file is not valid JSON.')
    }

    const source = (parsed as SoundPack)?.sounds ?? parsed
    const entries = safeRecordEntries(source)
    const accepted: [string, SoundDefinition][] = []

    await forEachYielding(entries, ([name, definition]) => {
      if (isValidSoundName(name) && isValidSoundDefinition(definition)) {
        accepted.push([name, cloneSoundDefinition(definition)])
      }
    })

    if (accepted.length === 0) {
      playback.cue('error')
      notifications.reportError('That file has no valid sound definitions.')
      throw new Error('No valid sound definitions found in that file.')
    }

    const imported = toCustomSoundMap(accepted)
    registerAll(imported)
    customSounds.value = { ...customSounds.value, ...imported }

    const result: ImportResult = { imported: accepted.length, skipped: entries.length - accepted.length }
    playback.cue('save')
    notifications.confirm(
      result.skipped > 0
        ? `Imported ${plural(result.imported, 'sound')}, skipped ${result.skipped} invalid`
        : `Imported ${plural(result.imported, 'sound')}`,
    )
    return result
  }

  function registerAll(sounds: Record<string, SoundDefinition>): void {
    for (const [name, definition] of Object.entries(sounds)) {
      playback.soundManager.register(name, definition)
    }
  }

  return {
    presets: DEFAULT_SOUNDS as Record<string, SoundDefinition>,
    customSounds,
    customSoundCount,
    hasCustomSounds,
    favorites,
    isFavorite,
    toggleFavorite,
    save,
    duplicate,
    remove,
    clear,
    exportPack,
    importPack,
  }
})

function nextCopyName(name: string, taken: readonly string[]): string {
  let candidate = `${name}_copy`
  for (let ordinal = 2; taken.includes(candidate); ordinal++) {
    candidate = `${name}_copy${ordinal}`
  }
  return candidate
}

function findSaveError(name: string, definition: SoundDefinition): string | undefined {
  if (!isValidSoundName(name)) {
    return SOUND_NAME_RULE
  }
  if (!isSafeKey(name)) {
    return 'That name is reserved.'
  }
  return validateSoundDefinition(definition).at(0)
}

/** Reserves preset names; a renamed sound never collides with another sound of the same batch */
function toCustomSoundMap(sounds: [string, SoundDefinition][]): Record<string, SoundDefinition> {
  const taken = new Set(sounds.map(([name]) => name))
  return Object.fromEntries(sounds.map(([name, definition]) => {
    const customName = toCustomSoundName(name, taken)
    taken.add(customName)
    return [customName, definition]
  }))
}

// Persisted data is untrusted
export function sanitizeSoundMap(raw: unknown): Record<string, SoundDefinition> {
  const kept: [string, SoundDefinition][] = []
  for (const [name, definition] of safeRecordEntries(raw)) {
    // Drops only names SoundManager rejects: older saves skipped SOUND_NAME_PATTERN
    if (name !== '' && isValidSoundDefinition(definition)) {
      kept.push([name, definition])
    }
  }
  // Migrates sounds saved before preset names were reserved
  return toCustomSoundMap(kept)
}
