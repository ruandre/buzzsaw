import { onKeyStroke } from '@vueuse/core'

/** Keyboard shortcut metadata rendered in shortcut dialog */
export interface Shortcut {
  /** Key label (e.g. '1-5', 'Space') */
  keys: string
  description: string
  group: 'Navigation' | 'Playback' | 'Synthesizer'
}

export const SHORTCUTS: readonly Shortcut[] = [
  { keys: '1-5', description: 'Jump to a view', group: 'Navigation' },
  { keys: '/', description: 'Search presets', group: 'Navigation' },
  { keys: '?', description: 'Show shortcuts', group: 'Navigation' },
  { keys: 'Esc', description: 'Close dialogs', group: 'Navigation' },
  { keys: 'M', description: 'Mute or unmute', group: 'Playback' },
  { keys: 'S', description: 'Stop all sounds', group: 'Playback' },
  { keys: 'Space', description: 'Audition the current patch', group: 'Synthesizer' },
  { keys: 'R', description: 'Randomize parameters', group: 'Synthesizer' },
]

export interface ShortcutHandlers {
  onNavigate: (position: number) => void
  onToggleShortcuts: () => void
  onToggleMute: () => void
  onStopAll: () => void
  onFocusSearch: () => void
  onRandomizeCreator: () => void
  onAuditionCreator: () => void
  isCreatorActive: () => boolean
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
const NAVIGATION_KEYS = ['1', '2', '3', '4', '5']

/** Binds global keyboard shortcuts; ignores keystrokes originating from editable inputs */
export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  function bind(keys: string | string[], run: (event: KeyboardEvent) => void): void {
    onKeyStroke(keys, (event) => {
      if (isTypingTarget(event.target)) {
        return
      }
      event.preventDefault()
      run(event)
    })
  }

  bind(NAVIGATION_KEYS, event => handlers.onNavigate(Number(event.key)))
  bind('?', handlers.onToggleShortcuts)
  bind('/', handlers.onFocusSearch)
  bind(['m', 'M'], handlers.onToggleMute)
  bind(['s', 'S'], handlers.onStopAll)
  bind(['r', 'R'], () => handlers.isCreatorActive() && handlers.onRandomizeCreator())
  bind(' ', () => handlers.isCreatorActive() && handlers.onAuditionCreator())
}

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  return Boolean(element)
    && (EDITABLE_TAGS.has(element!.tagName) || element!.isContentEditable)
}
