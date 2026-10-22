import { describe, expect, it } from 'vitest'
import { createAriaInvalidSync } from './useAriaInvalidSync'

function field({ isUserInvalid = false, ariaInvalid = null as string | null } = {}) {
  const attributes = new Map<string, string>(ariaInvalid === null ? [] : [['aria-invalid', ariaInvalid]])
  const target = {
    isUserInvalid,
    matches: (selector: string) => (selector === ':user-invalid' ? target.isUserInvalid : selector.includes('input')),
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => void attributes.set(name, value),
    removeAttribute: (name: string) => void attributes.delete(name),
  }
  return target
}

const eventOn = (target: unknown) => ({ target }) as unknown as Event

describe('createAriaInvalidSync', () => {
  it('flags a field the browser reports as user-invalid', () => {
    const { sync } = createAriaInvalidSync()
    const input = field({ isUserInvalid: true })

    sync(eventOn(input))

    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  it('clears its own flag once the value becomes valid', () => {
    const { sync, syncIfFlagged } = createAriaInvalidSync()
    const input = field({ isUserInvalid: true })
    sync(eventOn(input))

    input.isUserInvalid = false
    syncIfFlagged(eventOn(input))

    expect(input.getAttribute('aria-invalid')).toBeNull()
  })

  it('leaves an error flag the app set on a field without constraints', () => {
    const { sync } = createAriaInvalidSync()
    const input = field({ ariaInvalid: 'true' })

    sync(eventOn(input))

    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  it('ignores events from elements that are not form fields', () => {
    const { sync } = createAriaInvalidSync()
    const button = { ...field({ isUserInvalid: true }), matches: () => false }

    sync(eventOn(button))

    expect(button.getAttribute('aria-invalid')).toBeNull()
  })
})
