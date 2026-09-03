export type SoundCategory = 'ui' | 'notifications' | 'alerts' | 'scifi' | 'game' | 'music' | 'tones'

export type CategoryFilter = 'all' | 'favorites' | SoundCategory

interface CategoryDescriptor {
  id: SoundCategory
  label: string
  /** Substrings matched against lowercase preset name; first match wins */
  keywords: readonly string[]
}

// Evaluated in order; earlier entries win; 'tones' is fallback
const CATEGORY_TABLE: readonly CategoryDescriptor[] = [
  {
    id: 'ui',
    label: 'UI & Clicks',
    keywords: [
      'click',
      'pop',
      'drop',
      'expand',
      'collapse',
      'tick',
      'pluck',
      'clink',
      'tap',
      'swipe',
      'toggle',
      'button',
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    keywords: [
      'ding',
      'chime',
      'jingle',
      'ping',
      'notification',
      'info',
      'blip',
      'confirm',
      'flourish',
      'ring',
      'bell',
      'success',
      'message',
    ],
  },
  {
    id: 'alerts',
    label: 'Alerts & Alarms',
    keywords: [
      'alarm',
      'alert',
      'error',
      'buzz',
      'klaxon',
      'horn',
      'fail',
      'deny',
      'pulse',
      'warning',
      'danger',
      'critical',
      'siren',
      'evac',
      'dispatch',
      'monitor',
      'flatline',
    ],
  },
  {
    id: 'scifi',
    label: 'Sci-Fi & FX',
    keywords: [
      'laser',
      'glitch',
      'zap',
      'cosmic',
      'pixel',
      'space',
      'robot',
      'engine',
      'warp',
      'power',
      'teleport',
      'synth',
      'alien',
    ],
  },
  {
    id: 'game',
    label: 'Game',
    keywords: [
      'arcade',
      'coin',
      'quest',
      'boss',
      'strike',
      'shield',
      'gameover',
      'combo',
    ],
  },
  {
    id: 'music',
    label: 'Musical',
    keywords: [
      'arpeggio',
      'chord',
      'melody',
      'bass',
      'groove',
      'motif',
      'stab',
    ],
  },
  { id: 'tones', label: 'Tones', keywords: [] },
]

const FALLBACK_CATEGORY: SoundCategory = 'tones'

export const CATEGORY_FILTERS: readonly { id: CategoryFilter, label: string }[] = [
  { id: 'all', label: 'All Presets' },
  { id: 'favorites', label: 'Starred' },
  ...CATEGORY_TABLE.map(({ id, label }) => ({ id: id as CategoryFilter, label })),
]

export const SOUND_CATEGORIES: readonly SoundCategory[] = CATEGORY_TABLE.map(({ id }) => id)

/** Classifies preset by keyword match; defaults to 'tones' */
export function getSoundCategory(name: string): SoundCategory {
  const lowercased = name.toLowerCase()
  const match = CATEGORY_TABLE.find(({ keywords }) =>
    keywords.some(keyword => lowercased.includes(keyword)),
  )
  return match?.id ?? FALLBACK_CATEGORY
}

export function countByCategory(
  names: readonly string[],
  favoriteCount: number,
): Record<CategoryFilter, number> {
  const counts = {
    ...Object.fromEntries(SOUND_CATEGORIES.map(id => [id, 0])),
    all: names.length,
    favorites: favoriteCount,
  } as Record<CategoryFilter, number>
  for (const name of names) {
    counts[getSoundCategory(name)]++
  }
  return counts
}
