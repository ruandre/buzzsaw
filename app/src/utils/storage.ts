import type { RemovableRef } from '@vueuse/core'
import { useLocalStorage } from '@vueuse/core'

/** LocalStorage keys owned by the studio */
export const STORAGE_KEYS = {
  theme: 'buzzsaw_studio_theme',
  customSounds: 'buzzsaw_studio_custom_sounds',
  favorites: 'buzzsaw_studio_favorites',
  aiHistory: 'buzzsaw_studio_ai_history',
  shortcuts: 'buzzsaw_studio_shortcuts',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

// Only `__proto__` assignment replaces prototype; `constructor`/`prototype` are valid sound names
const UNSAFE_KEYS = new Set(['__proto__'])

/** Reactive localStorage ref with sanitization on read and cross-tab sync */
export function usePersistedState<T>(
  key: StorageKey,
  initial: T,
  sanitize: (raw: unknown) => T,
): RemovableRef<T> {
  return useLocalStorage<T>(key, initial, {
    serializer: {
      read: raw => sanitize(JSON.parse(raw)),
      write: value => JSON.stringify(value),
    },
    onError: error => console.error(`localStorage unavailable for "${key}":`, error),
  })
}

/** Returns object entries excluding prototype-polluting keys */
export function safeRecordEntries(raw: unknown): [string, unknown][] {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return []
  }
  return Object.entries(raw).filter(([key]) => !UNSAFE_KEYS.has(key))
}

export function isSafeKey(key: string): boolean {
  return !UNSAFE_KEYS.has(key)
}
