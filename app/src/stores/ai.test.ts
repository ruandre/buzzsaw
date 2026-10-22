import type { DesignedSound, PromptApiStatus } from '../ai'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkPromptApiAvailability, designSound } from '../ai'
import { sanitizeHistory, useAiStore } from './ai'

vi.mock('../ai', () => ({
  checkPromptApiAvailability: vi.fn(),
  designSound: vi.fn(),
  redesignSound: vi.fn(),
}))
vi.mock('./playback', () => ({ usePlaybackStore: () => ({ play: vi.fn(), audition: vi.fn(), cue: vi.fn() }) }))
vi.mock('./library', () => ({ useLibraryStore: () => ({ saveAsNew: vi.fn() }) }))
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

  it('renames a generated sound that shares a preset name', async () => {
    checkAvailability.mockResolvedValue(status('available'))
    vi.mocked(designSound).mockResolvedValue({
      name: 'pop',
      description: '',
      definition: { frequency: 440 },
      source: 'model',
      designedAt: 1,
    })
    const ai = useAiStore()

    const entry = await ai.generate('pop')

    expect(entry.name).toBe('pop_custom')
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

describe('ai store runs', () => {
  const designed: DesignedSound = { name: 'zap', description: '', definition: { frequency: 440 }, source: 'model', designedAt: 1 }

  beforeEach(() => {
    setActivePinia(createPinia())
    checkAvailability.mockResolvedValue(status('available'))
  })

  it('refuses a second run while one is in flight, leaving the first in charge', async () => {
    let finishDesign: (sound: DesignedSound) => void = () => {}
    vi.mocked(designSound).mockReturnValueOnce(new Promise((resolve) => {
      finishDesign = resolve
    }))
    const ai = useAiStore()
    const first = ai.generate('zap')

    await expect(ai.generate('boom')).rejects.toThrow(/already designing/)
    expect(ai.isGenerating).toBe(true)
    expect(ai.lastError).toBeNull()

    finishDesign(designed)
    await expect(first).resolves.toMatchObject({ name: 'zap' })
    expect(ai.isGenerating).toBe(false)
  })
})

describe('sanitizeHistory', () => {
  it('keeps a stored entry whose steps carry extra keys, without those keys', () => {
    const stored = { id: 'a', name: 'zap', definition: { frequency: { start: 440, steps: [{ value: 220, time: 0.1, interpolation: 'linear' }] } } }

    const [entry] = sanitizeHistory([stored])

    expect(entry?.definition.frequency).toEqual({ start: 440, steps: [{ value: 220, time: 0.1 }] })
  })

  it('drops a stored entry whose steps cannot be read, keeping the rest', () => {
    const broken = { id: 'a', name: 'broken', definition: { frequency: { start: 440, steps: [null] } } }
    const kept = { id: 'b', name: 'zap', definition: { frequency: 440 } }

    expect(sanitizeHistory([broken, kept]).map(entry => entry.id)).toEqual(['b'])
  })
})
