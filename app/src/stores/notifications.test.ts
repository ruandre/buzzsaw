import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotificationsStore } from './notifications'

describe('notifications store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('dismisses an informational notice on its own', () => {
    const notifications = useNotificationsStore()

    notifications.announce('Saved')
    vi.advanceTimersByTime(60_000)

    expect(notifications.notices).toEqual([])
  })

  it('keeps an error until the user dismisses it, however long they take to read it', () => {
    const notifications = useNotificationsStore()

    const id = notifications.reportError('Could not export.')
    vi.advanceTimersByTime(60_000)

    expect(notifications.notices.map(notice => notice.message)).toEqual(['Could not export.'])

    notifications.dismiss(id)
    expect(notifications.notices).toEqual([])
  })
})
