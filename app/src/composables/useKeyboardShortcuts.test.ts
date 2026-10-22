import type { ShortcutEvent, ShortcutHandlers } from './useKeyboardShortcuts'
import { describe, expect, it, vi } from 'vitest'
import { resolveShortcut } from './useKeyboardShortcuts'

function handlers(overrides: Partial<ShortcutHandlers> = {}): ShortcutHandlers {
  return {
    onNavigate: vi.fn(),
    onToggleShortcuts: vi.fn(),
    onToggleMute: vi.fn(),
    onStopAll: vi.fn(),
    onFocusSearch: vi.fn(),
    onRandomizeCreator: vi.fn(),
    onAuditionCreator: vi.fn(),
    isCreatorActive: () => true,
    areShortcutsEnabled: () => true,
    ...overrides,
  }
}

function element(tagName: string, { role = null as string | null, isContentEditable = false, isInModal = false } = {}): EventTarget {
  return {
    tagName,
    isContentEditable,
    getAttribute: (name: string) => (name === 'role' ? role : null),
    closest: (selector: string) => (isInModal && selector.includes('dialog') ? {} : null),
  } as unknown as EventTarget
}

function keydown(key: string, overrides: Partial<ShortcutEvent> = {}): ShortcutEvent {
  return {
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    repeat: false,
    defaultPrevented: false,
    target: element('BODY'),
    ...overrides,
  }
}

describe('resolveShortcut', () => {
  it('ignores a held key auto-repeating, so R randomizes once per press', () => {
    expect(resolveShortcut(keydown('r', { repeat: true }), handlers())).toBeUndefined()
  })

  it('ignores a keystroke another handler already consumed', () => {
    expect(resolveShortcut(keydown('2', { defaultPrevented: true }), handlers())).toBeUndefined()
  })

  it.each(['1', 'm', 's', '?'])('leaves %j to an open dialog that has focus', (key) => {
    expect(resolveShortcut(keydown(key, { target: element('BUTTON', { isInModal: true }) }), handlers())).toBeUndefined()
  })

  it.each(['1', '/', '?', 'm', 's', 'r', ' '])('leaves %j to the page while shortcuts are turned off', (key) => {
    expect(resolveShortcut(keydown(key), handlers({ areShortcutsEnabled: () => false }))).toBeUndefined()
  })

  it('navigates to the view matching a number key', () => {
    const bound = handlers()

    resolveShortcut(keydown('3'), bound)?.()

    expect(bound.onNavigate).toHaveBeenCalledWith(3)
  })

  it.each([
    ['?', 'onToggleShortcuts'],
    ['/', 'onFocusSearch'],
    ['m', 'onToggleMute'],
    ['M', 'onToggleMute'],
    ['s', 'onStopAll'],
    ['S', 'onStopAll'],
    ['r', 'onRandomizeCreator'],
    ['R', 'onRandomizeCreator'],
    [' ', 'onAuditionCreator'],
  ] as const)('runs %j as %s', (key, handler) => {
    const bound = handlers()

    resolveShortcut(keydown(key), bound)?.()

    expect(bound[handler]).toHaveBeenCalledOnce()
  })

  it('ignores keys without a shortcut', () => {
    expect(resolveShortcut(keydown('x'), handlers())).toBeUndefined()
  })

  it.each([' ', 'r'])('leaves %j alone outside the creator', (key) => {
    const bound = handlers({ isCreatorActive: () => false })

    expect(resolveShortcut(keydown(key), bound)).toBeUndefined()
  })

  it.each(['ctrlKey', 'metaKey', 'altKey'] as const)('leaves keys alone while %s is held', (modifier) => {
    expect(resolveShortcut(keydown('r', { [modifier]: true }), handlers())).toBeUndefined()
    expect(resolveShortcut(keydown('1', { [modifier]: true }), handlers())).toBeUndefined()
  })

  it.each([
    ['input', element('INPUT')],
    ['textarea', element('TEXTAREA')],
    ['select', element('SELECT')],
    ['contenteditable', element('DIV', { isContentEditable: true })],
    ['combobox', element('BUTTON', { role: 'combobox' })],
    ['option', element('DIV', { role: 'option' })],
    ['menuitem', element('DIV', { role: 'menuitem' })],
  ])('leaves typing to a focused %s', (_, target) => {
    expect(resolveShortcut(keydown('m', { target }), handlers())).toBeUndefined()
    expect(resolveShortcut(keydown(' ', { target }), handlers())).toBeUndefined()
  })

  it.each([
    ['button', element('BUTTON')],
    ['link', element('A')],
    ['button role', element('SPAN', { role: 'button' })],
    ['checkbox role', element('SPAN', { role: 'checkbox' })],
    ['radio role', element('SPAN', { role: 'radio' })],
    ['switch role', element('SPAN', { role: 'switch' })],
    ['tab role', element('SPAN', { role: 'tab' })],
    ['slider role', element('SPAN', { role: 'slider' })],
  ])('leaves space to a focused %s', (_, target) => {
    expect(resolveShortcut(keydown(' ', { target }), handlers())).toBeUndefined()
  })

  it('still runs letter shortcuts from a focused button', () => {
    const bound = handlers()

    resolveShortcut(keydown('s', { target: element('BUTTON') }), bound)?.()

    expect(bound.onStopAll).toHaveBeenCalledOnce()
  })
})
