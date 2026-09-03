import type { RemovableRef } from '@vueuse/core'
import { useLocalStorage } from '@vueuse/core'

/** LocalStorage keys owned by the studio */
export const STORAGE_KEYS = {
  theme: 'buzzsaw_studio_theme',
  customSounds: 'buzzsaw_studio_custom_sounds',
  favorites: 'buzzsaw_studio_favorites',
  aiHistory: 'buzzsaw_studio_ai_history',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

// Prototype pollution keys
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

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

/** Removes all studio-owned keys from localStorage */
export function clearAllStoredData(): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    try {
      window.localStorage.removeItem(key)
    }
    catch (error) {
      console.error(`Failed to clear localStorage key "${key}":`, error)
    }
  }
}
