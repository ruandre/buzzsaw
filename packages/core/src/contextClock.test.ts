import { afterEach, describe, expect, it, vi } from 'vitest'
import { GECKO_START_LEAD_S } from './constants.js'
import { isOfflineContext, resolveLiveStartTime } from './contextClock.js'
import { createMockAudioContext } from './testing/mockAudioContext.js'

const FIREFOX_UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0'
const LIBREWOLF_UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0 LibreWolf/144.0'
const CHROME_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const SAFARI_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
// Firefox on iOS runs WebKit, whose clock is not stale
const FIREFOX_IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/144.0 Mobile/15E148 Safari/605.1.15'

function useUserAgent(userAgent: string): void {
  vi.stubGlobal('navigator', { userAgent })
}

async function drainMicrotasks(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve()
  }
}

describe('resolveLiveStartTime', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('waits past every pending microtask, since Firefox refreshes currentTime only between tasks', async () => {
    const context = createMockAudioContext()
    let isSettled = false
    const pending = resolveLiveStartTime(context).then(() => {
      isSettled = true
    })

    await drainMicrotasks()
    expect(isSettled).toBe(false)
    await pending
  })

  it('reads the clock after yielding, not when called', async () => {
    useUserAgent(CHROME_UA)
    const context = createMockAudioContext({ currentTime: 1 })

    const pending = resolveLiveStartTime(context)
    context.currentTime = 1.05

    await expect(pending).resolves.toBe(1.05)
  })

  it.each([
    ['Firefox', FIREFOX_UA],
    ['a Gecko fork', LIBREWOLF_UA],
  ])('leads the clock in %s, whose currentTime can trail one render callback', async (_, userAgent) => {
    useUserAgent(userAgent)
    const context = createMockAudioContext({ currentTime: 2 })

    await expect(resolveLiveStartTime(context)).resolves.toBe(2 + GECKO_START_LEAD_S)
  })

  it.each([
    ['Chrome', CHROME_UA],
    ['Safari', SAFARI_UA],
    ['Firefox on iOS', FIREFOX_IOS_UA],
  ])('adds no latency in %s, whose clock is current', async (_, userAgent) => {
    useUserAgent(userAgent)
    const context = createMockAudioContext({ currentTime: 2 })

    await expect(resolveLiveStartTime(context)).resolves.toBe(2)
  })

  it('adds no latency where no navigator exists, as in older Node', async () => {
    vi.stubGlobal('navigator', undefined)
    const context = createMockAudioContext({ currentTime: 2 })

    await expect(resolveLiveStartTime(context)).resolves.toBe(2)
  })
})

describe('isOfflineContext', () => {
  it('recognizes an offline context by its startRendering method', () => {
    const offline = Object.assign(createMockAudioContext(), { startRendering: vi.fn() })

    expect(isOfflineContext(offline)).toBe(true)
  })

  it('treats a realtime context as live', () => {
    expect(isOfflineContext(createMockAudioContext())).toBe(false)
  })
})
