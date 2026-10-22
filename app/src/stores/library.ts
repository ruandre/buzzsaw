import type { SoundDefinition, SoundPack } from '@rjvr/buzzsaw'
import { cloneSoundDefinition, isValidSoundDefinition, validateSoundDefinition } from '@rjvr/buzzsaw'
import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'
import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { isValidSoundName, SOUND_NAME_RULE, toCustomSoundName } from '../audio/soundName'
import { restoreSoundDefinition } from '../audio/storedSound'
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

  // Sync flush: persisted sounds must be playable before any playback call; storage events from other tabs replace the map
  watch(customSounds, (next, previous) => syncRegistrations(previous ?? {}, next), { flush: 'sync', immediate: true })

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

  /** Saves without replacing a different library sound: a taken name gets a `_copy` suffix, an identical sound stays as is */
  function saveAsNew(name: string, definition: SoundDefinition): string | null {
    const soundName = toCustomSoundName(name.trim() || 'unnamed_sound')
    const existing = ownEntry(customSounds.value, soundName)
    if (existing === undefined) {
      return save(name, definition)
    }
    if (isSameDefinition(existing, definition)) {
      notifications.confirm(`"${soundName}" is already in your library`)
      return soundName
    }
    return save(nextCopyName(soundName, Object.keys(customSounds.value)), definition)
  }

  /** Saves a copy of a library sound under the first free `_copy` name; returns it, or null if `name` is not in the library */
  function duplicate(name: string): string | null {
    const sound = ownEntry(customSounds.value, name)
    return sound === undefined ? null : save(nextCopyName(name, Object.keys(customSounds.value)), sound)
  }

  function remove(name: string): void {
    const { [name]: removed, ...rest } = customSounds.value
    if (!removed) {
      return
    }
    customSounds.value = rest
    playback.cue('discard')
    notifications.announce(`Deleted "${name}"`, 'info', 'polite')
  }

  function clear(): void {
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

    const source = isSoundPack(parsed) ? parsed.sounds : parsed
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

    const imported = renameCollisions(toCustomSoundMap(accepted), customSounds.value)
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

  // Re-registering an unchanged sound would stop its playing voices
  function syncRegistrations(previous: Record<string, SoundDefinition>, next: Record<string, SoundDefinition>): void {
    for (const name of Object.keys(previous)) {
      if (!Object.hasOwn(next, name)) {
        playback.soundManager.unregister(name)
      }
    }
    for (const [name, definition] of Object.entries(next)) {
      if (!isRegisteredAs(name, definition)) {
        playback.soundManager.register(name, definition)
      }
    }
  }

  function isRegisteredAs(name: string, definition: SoundDefinition): boolean {
    const registered = playback.soundManager.get(name)?.definition
    return registered !== undefined && isSameDefinition(registered, definition)
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
    saveAsNew,
    duplicate,
    remove,
    clear,
    exportPack,
    importPack,
  }
})

// Clones share one key order, so their JSON compares structurally
function isSameDefinition(a: Readonly<SoundDefinition>, b: SoundDefinition): boolean {
  return JSON.stringify(cloneSoundDefinition(a)) === JSON.stringify(cloneSoundDefinition(b))
}

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

// A flat sound map may hold a sound named "sounds"; only a pack carries a numeric version
function isSoundPack(value: unknown): value is SoundPack {
  const candidate = value as Partial<SoundPack> | null
  return typeof candidate?.version === 'number' && typeof candidate.sounds === 'object' && candidate.sounds !== null
}

/** An incoming sound never replaces a different library sound; an identical one is already there */
function renameCollisions(
  incoming: Record<string, SoundDefinition>,
  library: Record<string, SoundDefinition>,
): Record<string, SoundDefinition> {
  const taken = [...Object.keys(library), ...Object.keys(incoming)]
  return Object.fromEntries(Object.entries(incoming).map(([name, definition]) => {
    const existing = ownEntry(library, name)
    if (existing === undefined || isSameDefinition(existing, definition)) {
      return [name, definition]
    }
    const copyName = nextCopyName(name, taken)
    taken.push(copyName)
    return [copyName, definition]
  }))
}

function ownEntry(sounds: Record<string, SoundDefinition>, name: string): SoundDefinition | undefined {
  return Object.hasOwn(sounds, name) ? sounds[name] : undefined
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
    const restored = restoreSoundDefinition(definition)
    if (name !== '' && restored) {
      kept.push([name, restored])
    }
  }
  // Migrates sounds saved before preset names were reserved
  return toCustomSoundMap(kept)
}
