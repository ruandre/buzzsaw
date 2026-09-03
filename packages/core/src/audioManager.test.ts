import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  closeAudioContext,
  ensureAudioContextReady,
  getAudioContextClass,
  getAudioContextInstance,
  isAudioContextSupported,
  setAudioContextInstance,
} from './audioManager'

class MockAudioContext {
  state: AudioContextState
  resume: () => Promise<void>
  close: () => Promise<void>
  constructor(state: AudioContextState = 'running') {
    this.state = state
    this.resume = vi.fn(() => {
      this.state = 'running'
      return Promise.resolve()
    })
    this.close = vi.fn(() => {
      this.state = 'closed'
      return Promise.resolve()
    })
  }
}

const ORIGINAL_AUDIO_CONTEXT = globalThis.AudioContext
const ORIGINAL_CONSOLE_ERROR = console.error
const ORIGINAL_CONSOLE_WARN = console.warn

beforeEach(() => {
  vi.resetAllMocks()
  setAudioContextInstance(null)
  globalThis.AudioContext = undefined as unknown as typeof AudioContext
  console.error = vi.fn()
  console.warn = vi.fn()
})

afterEach(() => {
  globalThis.AudioContext = ORIGINAL_AUDIO_CONTEXT
  setAudioContextInstance(null)
  console.error = ORIGINAL_CONSOLE_ERROR
  console.warn = ORIGINAL_CONSOLE_WARN
})

describe('audioManager helpers', () => {
  it('detects Web Audio API support accurately with isAudioContextSupported', () => {
    expect(isAudioContextSupported()).toBe(false)
    globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext
    expect(isAudioContextSupported()).toBe(true)
  })

  it('returns constructor with getAudioContextClass', () => {
    expect(getAudioContextClass()).toBeNull()
    globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext
    expect(getAudioContextClass()).toBe(MockAudioContext)
  })
})

describe('audioManager getAudioContextInstance', () => {
  it('returns null and logs error if AudioContext is not supported', () => {
    globalThis.AudioContext = undefined as unknown as typeof AudioContext
    const ctx = getAudioContextInstance()

    expect(ctx).toBeNull()
    expect(console.error).toHaveBeenCalledWith('Web Audio API is not supported in this environment.')
  })

  it('creates and returns a new AudioContext if supported', () => {
    globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext
    const ctx = getAudioContextInstance()

    expect(ctx).toBeInstanceOf(MockAudioContext)
  })

  it('returns the same AudioContext instance on subsequent calls', () => {
    globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext
    const ctx1 = getAudioContextInstance()
    const ctx2 = getAudioContextInstance()

    expect(ctx1).toBe(ctx2)
  })

  it('closes active context and resets instance with closeAudioContext', async () => {
    globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext
    const ctx = getAudioContextInstance()
    expect(ctx).not.toBeNull()

    await closeAudioContext()
    expect((ctx as unknown as MockAudioContext).close).toHaveBeenCalled()
  })
})

describe('audioManager ensureAudioContextReady', () => {
  it('resolves immediately if context is running', async () => {
    globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext
    const ctx = getAudioContextInstance()
    if (ctx) {
      (ctx as unknown as MockAudioContext).state = 'running'
    }

    await expect(ensureAudioContextReady()).resolves.toBe(ctx)
  })

  it('rejects if context is closed', async () => {
    globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext
    const ctx = getAudioContextInstance()
    if (ctx) {
      (ctx as unknown as MockAudioContext).state = 'closed'
    }

    await expect(ensureAudioContextReady()).rejects.toThrow('AudioContext is closed and cannot be resumed.')
  })

  it('calls resume and logs warning if context is suspended', async () => {
    globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext
    const ctx = getAudioContextInstance()
    if (ctx) {
      (ctx as unknown as MockAudioContext).state = 'suspended'
    }

    await expect(ensureAudioContextReady()).resolves.toBe(ctx)
    expect(ctx?.resume).toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith(
      'AudioContext is suspended. User interaction (like a click) is needed to start audio.',
    )
  })
})
