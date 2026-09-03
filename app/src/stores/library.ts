import type { SoundDefinition, SoundPack } from '@rjvr/buzzsaw'
import { cloneSoundDefinition, isValidSoundDefinition } from '@rjvr/buzzsaw'
import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { downloadJson } from '../utils/download'
import { forEachYielding } from '../utils/scheduler'
import { safeRecordEntries, STORAGE_KEYS, usePersistedState } from '../utils/storage'
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

  /** Saves sound definition under name, overwriting existing entry */
  function save(name: string, definition: SoundDefinition): void {
    const soundName = name.trim() || 'unnamed_sound'
    const stored = cloneSoundDefinition(definition)
    customSounds.value = { ...customSounds.value, [soundName]: stored }
    playback.soundManager.register(soundName, stored)
    playback.cue('save')
    notifications.confirm(`Saved "${soundName}" to your library`)
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
      if (isValidSoundDefinition(definition)) {
        accepted.push([name, cloneSoundDefinition(definition)])
      }
    })

    if (accepted.length === 0) {
      playback.cue('error')
      notifications.reportError('That file has no valid sound definitions.')
      throw new Error('No valid sound definitions found in that file.')
    }

    customSounds.value = { ...customSounds.value, ...Object.fromEntries(accepted) }
    registerAll(Object.fromEntries(accepted))

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
    remove,
    clear,
    exportPack,
    importPack,
  }
})

// Persisted data is untrusted: drops prototype-polluting keys and invalid definitions
function sanitizeSoundMap(raw: unknown): Record<string, SoundDefinition> {
  const sounds: Record<string, SoundDefinition> = {}
  for (const [name, definition] of safeRecordEntries(raw)) {
    if (isValidSoundDefinition(definition)) {
      sounds[name] = definition
    }
  }
  return sounds
}
