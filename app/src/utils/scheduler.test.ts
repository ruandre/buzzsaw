import { afterEach, describe, expect, it, vi } from 'vitest'
import { forEachYielding, whenIdle, yieldToMain } from './scheduler'

const scope = globalThis as {
  scheduler?: { yield?: () => Promise<void> }
  requestIdleCallback?: (callback: () => void) => number
}

function installYieldSpy(): ReturnType<typeof vi.fn> {
  const spy = vi.fn(async () => {})
  scope.scheduler = { yield: spy }
  return spy
}

afterEach(() => {
  delete scope.scheduler
  delete scope.requestIdleCallback
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('yieldToMain', () => {
  it('prefers scheduler.yield when the host provides it', async () => {
    const spy = installYieldSpy()

    await yieldToMain()

    expect(spy).toHaveBeenCalledOnce()
  })

  it('falls back to a macrotask without it', async () => {
    const order: string[] = []
    const pending = yieldToMain().then(() => order.push('yield'))
    await Promise.resolve().then(() => order.push('microtask'))
    await pending

    expect(order).toEqual(['microtask', 'yield'])
  })
})

describe('forEachYielding', () => {
  it('visits every item with its index without yielding inside the budget', async () => {
    const spy = installYieldSpy()
    const seen: [string, number][] = []

    await forEachYielding(['a', 'b'], (item, index) => seen.push([item, index]))

    expect(seen).toEqual([['a', 0], ['b', 1]])
    expect(spy).not.toHaveBeenCalled()
  })

  it('yields once the slice exceeds the long-task budget', async () => {
    const spy = installYieldSpy()
    let clock = 0
    // Each item costs 30 ms, so every second item crosses the 50 ms budget
    vi.spyOn(performance, 'now').mockImplementation(() => clock)

    await forEachYielding([1, 2, 3, 4], () => {
      clock += 30
    })

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('does nothing for an empty list', async () => {
    const spy = installYieldSpy()
    const task = vi.fn()

    await forEachYielding([], task)

    expect(task).not.toHaveBeenCalled()
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('whenIdle', () => {
  it('runs the task in an idle callback when the host provides one', () => {
    const idleCallbacks: (() => void)[] = []
    scope.requestIdleCallback = (callback) => {
      idleCallbacks.push(callback)
      return idleCallbacks.length
    }
    const task = vi.fn()

    whenIdle(task)
    expect(task).not.toHaveBeenCalled()
    idleCallbacks.forEach(callback => callback())

    expect(task).toHaveBeenCalledOnce()
  })

  it('falls back to a one-second timer without it', () => {
    vi.useFakeTimers()
    const task = vi.fn()

    whenIdle(task)
    vi.advanceTimersByTime(999)
    expect(task).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)

    expect(task).toHaveBeenCalledOnce()
  })
})
