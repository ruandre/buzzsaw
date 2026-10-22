import type { MockAudioContext } from './testing/mockAudioContext.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setAudioContextInstance } from './audioManager.js'
import { Sound } from './Sound.js'
import { createMockAudioContext } from './testing/mockAudioContext.js'

describe('sound class', () => {
  let mockCtx: MockAudioContext

  beforeEach(() => {
    mockCtx = createMockAudioContext()
  })

  it('creates Sound instance with definition', () => {
    const sound = new Sound('test', {
      duration: 0.3,
      frequency: 440,
      gain: 0.5,
      waveType: 'sine',
    })

    expect(sound.name).toBe('test')
    expect(sound.duration).toBe(0.3)
    expect(sound.definition.frequency).toBe(440)
  })

  it('throws when initialized with invalid name', () => {
    expect(() => new Sound('', { frequency: 440 })).toThrow(TypeError)
    expect(() => new Sound(null as any, { frequency: 440 })).toThrow(TypeError)
  })

  it('updates definition with setDefinition', () => {
    const sound = new Sound('test', { frequency: 440 })
    sound.setDefinition({ frequency: 880, waveType: 'square' })

    expect(sound.definition.frequency).toBe(880)
    expect(sound.definition.waveType).toBe('square')
  })

  it('plays sound using audioContext option', async () => {
    const sound = new Sound('beep', {
      duration: 0.2,
      frequency: 880,
      waveType: 'triangle',
    })

    const handle = await sound.play({ audioContext: mockCtx })
    expect(mockCtx.createOscillator).toHaveBeenCalled()
    expect(mockCtx.createGain).toHaveBeenCalled()
    expect(handle.isPlaying).toBe(true)

    handle.stop()
    expect(handle.isPlaying).toBe(false)
  })

  it('stops all active handles when sound.stop() is called', async () => {
    const sound = new Sound('beep', { duration: 0.5, frequency: 440 })
    await sound.play({ audioContext: mockCtx })
    expect(sound.isPlaying).toBe(true)

    sound.stop()
    expect(sound.isPlaying).toBe(false)
  })

  it('clones sound correctly', () => {
    const sound = new Sound('original', {
      frequency: 500,
      waveType: 'sawtooth',
    })

    const cloned = sound.clone('copy')
    expect(cloned.name).toBe('copy')
    expect(cloned.definition.waveType).toBe('sawtooth')
    expect(cloned.definition.frequency).toBe(500)
  })

  it('serializes to JSON and deserializes with fromJSON', () => {
    const sound = new Sound('ding', {
      frequency: 1000,
      waveType: 'sine',
    })

    const json = sound.toJSON()
    expect(json.name).toBe('ding')
    expect(json.definition.frequency).toBe(1000)

    const reconstructed = Sound.fromJSON(json)
    expect(reconstructed).toBeInstanceOf(Sound)
    expect(reconstructed.name).toBe('ding')
    expect(reconstructed.definition.frequency).toBe(1000)
  })

  it('throws on invalid fromJSON parameter', () => {
    expect(() => Sound.fromJSON(null as any)).toThrow(TypeError)
    expect(() => Sound.fromJSON({} as any)).toThrow(TypeError)
  })

  it('rejects a malformed definition at construction', () => {
    expect(() => new Sound('bogus', { frequency: 'nope' } as never))
      .toThrow(/Invalid sound definition for "bogus"/)
  })

  it('freezes the exposed definition so callers cannot mutate a registered sound', () => {
    const sound = new Sound('swipe', {
      frequency: { start: 400, steps: [{ time: 0.1, value: 900 }] },
      duration: 0.2,
    })

    expect(Object.isFrozen(sound.definition)).toBe(true)
    expect(() => {
      ;(sound.definition as { duration?: number }).duration = 99
    }).toThrow(TypeError)
    expect(sound.definition.duration).toBe(0.2)
  })
})

describe('sound play awaiting the shared suspended context', () => {
  function suspendedSharedContext() {
    let resolveResume = () => {}
    const context = Object.assign(createMockAudioContext(), {
      state: 'suspended',
      resume: vi.fn(() => new Promise<void>((resolve) => {
        resolveResume = resolve
      })),
    })
    setAudioContextInstance(context)
    const finishResume = () => {
      context.state = 'running'
      resolveResume()
    }
    return { context, finishResume }
  }

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    setAudioContextInstance(null)
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('resolves a handle that never plays when the context never resumes', async () => {
    vi.useFakeTimers()
    const { context } = suspendedSharedContext()
    const sound = new Sound('drone', { duration: 5, frequency: 100 })

    const pending = sound.play()
    await vi.advanceTimersByTimeAsync(501)

    expect((await pending).isPlaying).toBe(false)
    expect(context.oscillators).toHaveLength(0)
  })

  it('plays on a suspended context passed explicitly, as an offline render does', async () => {
    const context = Object.assign(createMockAudioContext(), { state: 'suspended' as const })
    const sound = new Sound('drone', { duration: 5, frequency: 100 })

    await sound.play({ audioContext: context })

    expect(context.oscillators).toHaveLength(1)
  })

  it('starts the voice once the context resumes', async () => {
    const { context, finishResume } = suspendedSharedContext()
    const sound = new Sound('drone', { duration: 5, frequency: 100 })

    const pending = sound.play()
    finishResume()

    expect((await pending).isPlaying).toBe(true)
    expect(context.oscillators).toHaveLength(1)
  })

  it('cancels the play on stop before the context resumes', async () => {
    const { context, finishResume } = suspendedSharedContext()
    const sound = new Sound('drone', { duration: 5, frequency: 100 })

    const pending = sound.play()
    sound.stop()
    finishResume()

    const handle = await pending
    expect(handle.isPlaying).toBe(false)
    await expect(handle.promise).resolves.toBeUndefined()
    expect(context.oscillators).toHaveLength(0)
    expect(sound.isPlaying).toBe(false)
  })
})
