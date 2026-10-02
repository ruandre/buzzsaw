import type { PromptApiStatus } from '../ai'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkPromptApiAvailability, designSound } from '../ai'
import { useAiStore } from './ai'

vi.mock('../ai', () => ({
  checkPromptApiAvailability: vi.fn(),
  designSound: vi.fn(),
  redesignSound: vi.fn(),
}))
vi.mock('./playback', () => ({ usePlaybackStore: () => ({ play: vi.fn(), cue: vi.fn() }) }))
vi.mock('./library', () => ({ useLibraryStore: () => ({ save: vi.fn() }) }))
vi.mock('./notifications', () => ({
  useNotificationsStore: () => ({ announce: vi.fn(), confirm: vi.fn(), reportError: vi.fn() }),
}))

const checkAvailability = vi.mocked(checkPromptApiAvailability)

function status(availability: PromptApiStatus['availability']): PromptApiStatus {
  return { availability, isSupported: true, isReady: availability === 'available', message: '' }
}

describe('ai store availability', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    checkAvailability.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('re-queries availability after generation downloads the model', async () => {
    checkAvailability.mockResolvedValueOnce(status('downloadable'))
    vi.mocked(designSound).mockResolvedValue({
      name: 'Zap',
      description: '',
      definition: {} as never,
      source: 'model',
      designedAt: 1,
    })
    const ai = useAiStore()
    await ai.refreshAvailability()

    checkAvailability.mockResolvedValueOnce(status('available'))
    await ai.generate('zap')
    await vi.runAllTimersAsync()

    expect(ai.promptApi.availability).toBe('available')
  })

  it('polls while downloading until the model is ready', async () => {
    checkAvailability
      .mockResolvedValueOnce(status('downloading'))
      .mockResolvedValueOnce(status('available'))
    const ai = useAiStore()
    await ai.refreshAvailability()
    expect(ai.promptApi.availability).toBe('downloading')

    await vi.advanceTimersByTimeAsync(2000)
    expect(ai.promptApi.availability).toBe('available')

    await vi.advanceTimersByTimeAsync(10_000)
    expect(checkAvailability).toHaveBeenCalledTimes(2)
  })

  it('does not poll once the model is ready', async () => {
    checkAvailability.mockResolvedValue(status('available'))
    const ai = useAiStore()
    await ai.refreshAvailability()

    await vi.advanceTimersByTimeAsync(10_000)
    expect(checkAvailability).toHaveBeenCalledTimes(1)
  })
})
