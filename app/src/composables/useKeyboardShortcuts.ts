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
  /** Users can turn single-key shortcuts off (WCAG 2.1.4) */
  areShortcutsEnabled: () => boolean
}

export type ShortcutEvent = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'repeat' | 'defaultPrevented' | 'target'>
export type ShortcutAction = () => void

const TEXT_ENTRY_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
// Widgets consuming printable keys for typeahead or text entry
const TYPEAHEAD_ROLES = new Set(['combobox', 'option', 'menuitem'])
const ACTIVATABLE_TAGS = new Set(['BUTTON', 'A'])
const ACTIVATABLE_ROLES = new Set(['button', 'checkbox', 'radio', 'switch', 'tab', 'slider'])
const NAVIGATION_KEYS = new Set(['1', '2', '3', '4', '5'])
// Shortcuts would act on the page hidden behind an open dialog
const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"]'

/** Binds global keyboard shortcuts; cancels default only for keystrokes a shortcut handled */
export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  onKeyStroke((event) => {
    const action = resolveShortcut(event, handlers)
    if (!action) {
      return
    }
    event.preventDefault()
    action()
  })
}

/**
 * Shift allowed (`?` needs it on most layouts). Ctrl, Meta, Alt chords left to browser/OS.
 *
 * @returns Action to run, or `undefined` when keystroke belongs to browser or focused control.
 */
export function resolveShortcut(event: ShortcutEvent, handlers: ShortcutHandlers): ShortcutAction | undefined {
  const isChord = event.ctrlKey || event.metaKey || event.altKey
  // Auto-repeat would re-run an action per repeat, such as randomizing many times while R is held
  const isHandledElsewhere = event.repeat || event.defaultPrevented
  if (!handlers.areShortcutsEnabled() || isChord || isHandledElsewhere || targetOwnsKey(event.target, event.key)) {
    return undefined
  }
  return actionFor(event.key.toLowerCase(), handlers)
}

function actionFor(key: string, handlers: ShortcutHandlers): ShortcutAction | undefined {
  switch (key) {
    case '?': return handlers.onToggleShortcuts
    case '/': return handlers.onFocusSearch
    case 'm': return handlers.onToggleMute
    case 's': return handlers.onStopAll
    case 'r': return creatorAction(handlers, handlers.onRandomizeCreator)
    case ' ': return creatorAction(handlers, handlers.onAuditionCreator)
    default: return NAVIGATION_KEYS.has(key) ? () => handlers.onNavigate(Number(key)) : undefined
  }
}

function creatorAction(handlers: ShortcutHandlers, action: ShortcutAction): ShortcutAction | undefined {
  return handlers.isCreatorActive() ? action : undefined
}

function targetOwnsKey(target: EventTarget | null, key: string): boolean {
  const element = target as HTMLElement | null
  if (!element?.tagName) {
    return false
  }
  const role = element.getAttribute('role') ?? ''
  if (TEXT_ENTRY_TAGS.has(element.tagName) || element.isContentEditable || TYPEAHEAD_ROLES.has(role)) {
    return true
  }
  if (element.closest?.(DIALOG_SELECTOR)) {
    return true
  }
  return key === ' ' && (ACTIVATABLE_TAGS.has(element.tagName) || ACTIVATABLE_ROLES.has(role))
}
