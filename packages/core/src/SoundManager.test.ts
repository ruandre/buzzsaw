import type { MockAudioContext } from './testing/mockAudioContext.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setAudioContextInstance } from './audioManager.js'
import { Sound } from './Sound.js'
import { SoundManager } from './SoundManager.js'
import { createMockAudioContext } from './testing/mockAudioContext.js'

describe('soundManager', () => {
  let mockCtx: MockAudioContext

  beforeEach(() => {
    mockCtx = createMockAudioContext()
  })

  it('starts empty so the engine ships without any sounds', () => {
    const manager = new SoundManager()
    expect(manager.size).toBe(0)
    expect(manager.list()).toEqual([])
  })

  it('takes the optional preset pack through registerAll', async () => {
    const { DEFAULT_SOUNDS } = await import('./sounds.js')
    const manager = new SoundManager().registerAll(DEFAULT_SOUNDS)

    expect(manager.size).toBeGreaterThan(50)
    expect(manager.has('ding')).toBe(true)
    expect(manager.has('click')).toBe(true)
  })

  it('registers and retrieves custom sounds', () => {
    const manager = new SoundManager().register('laser', {
      duration: 0.1,
      frequency: 1500,
      waveType: 'sawtooth',
    })

    expect(manager.get('laser')).toBeInstanceOf(Sound)
    expect(manager.has('laser')).toBe(true)
    expect(manager.get('laser')?.definition.frequency).toBe(1500)
    expect(manager.getAll()).toHaveLength(1)
  })

  it('batch registers with registerAll', () => {
    const manager = new SoundManager()
    manager.registerAll({
      one: { frequency: 440 },
      two: { frequency: 880 },
    })

    expect(manager.size).toBe(2)
    expect(manager.has('one')).toBe(true)
    expect(manager.has('two')).toBe(true)
  })

  it('unregisters sounds', () => {
    const manager = new SoundManager()
    manager.register('test', { frequency: 440, waveType: 'sine' })
    expect(manager.has('test')).toBe(true)
    expect(manager.unregister('test')).toBe(true)
    expect(manager.has('test')).toBe(false)
    expect(manager.unregister('nonexistent')).toBe(false)
  })

  it('rejects a master volume outside 0 to 2 instead of silently clamping', () => {
    const manager = new SoundManager({ masterVolume: 1.5 })
    expect(manager.masterVolume).toBe(1.5)

    expect(() => {
      manager.masterVolume = 3.5
    }).toThrow(RangeError)
    expect(() => {
      manager.masterVolume = -1.0
    }).toThrow(RangeError)
    expect(() => new SoundManager({ masterVolume: Number.NaN })).toThrow(RangeError)
    expect(manager.masterVolume).toBe(1.5)
  })

  it('reports an unregistered name through onMissing instead of the console', async () => {
    const onMissing = vi.fn()
    const manager = new SoundManager<'pop'>({ audioContext: mockCtx, onMissing })

    expect(await manager.play('pop')).toBeNull()
    expect(onMissing).toHaveBeenCalledWith('pop')
  })

  it('rejects an invalid definition at registration rather than at playback', () => {
    const manager = new SoundManager()
    expect(() => manager.register('bogus', { frequency: 'nope' } as never))
      .toThrow(/Invalid sound definition for "bogus"/)
    expect(manager.has('bogus')).toBe(false)
  })

  it('routes a voice through the master bus rather than straight to the speakers', async () => {
    const manager = new SoundManager({ audioContext: mockCtx, masterVolume: 0.8 }).register('pop', { duration: 0.1, frequency: 600, gain: 0.5 })

    const handle = await manager.play('pop')

    expect(handle).not.toBeNull()
    const [busFader, voiceGain] = mockCtx.gainNodes
    expect(busFader.gain.setTargetAtTime).toHaveBeenCalledWith(0.8, expect.any(Number), expect.any(Number))
    expect(voiceGain.connect).toHaveBeenCalledWith(busFader)
    expect(voiceGain.connect).not.toHaveBeenCalledWith(mockCtx.destination)
  })

  it('builds the bus once and keeps every voice on it', async () => {
    const manager = new SoundManager({ audioContext: mockCtx }).register('pop', { duration: 0.1, frequency: 600 })

    await manager.play('pop')
    await manager.play('pop')

    expect(mockCtx.gainNodes).toHaveLength(3)
    expect(manager.dispose).toBeInstanceOf(Function)
  })

  it('resumes a suspended context it was given before playing', async () => {
    const context = Object.assign(mockCtx, {
      state: 'suspended',
      resume: vi.fn(async () => {
        context.state = 'running'
      }),
    })
    const manager = new SoundManager({ audioContext: context }).register('pop', { duration: 0.1, frequency: 600 })

    await manager.play('pop')

    expect(context.resume).toHaveBeenCalledOnce()
  })

  it('stops a playing sound when its name is registered again, so stopAll still reaches every voice', async () => {
    const manager = new SoundManager({ audioContext: mockCtx }).register('drone', { duration: 5, frequency: 100 })
    const handle = await manager.play('drone')

    manager.register('drone', { duration: 5, frequency: 200 })

    expect(handle?.isPlaying).toBe(false)
  })

  it('keeps a sound playing when the same instance is registered again', async () => {
    const sound = new Sound('drone', { duration: 5, frequency: 100 })
    const manager = new SoundManager({ audioContext: mockCtx }).register('drone', sound)
    const handle = await manager.play('drone')

    manager.register('drone', sound)

    expect(handle?.isPlaying).toBe(true)
  })

  it('rejects play on a closed context it was given', async () => {
    const context = Object.assign(mockCtx, { state: 'closed', resume: vi.fn() })
    const manager = new SoundManager({ audioContext: context }).register('pop', { duration: 0.1, frequency: 600 })

    await expect(manager.play('pop')).rejects.toThrow('AudioContext is closed')
    expect(context.oscillators).toHaveLength(0)
  })

  it('moves the fader on sounds that are already playing', async () => {
    const manager = new SoundManager({ audioContext: mockCtx }).register('drone', { duration: 5, frequency: 100 })
    await manager.play('drone')

    manager.masterVolume = 0.25

    const busFader = mockCtx.gainNodes[0]
    expect(busFader.gain.setTargetAtTime).toHaveBeenLastCalledWith(0.25, expect.any(Number), expect.any(Number))
  })

  it('keeps voices on the master bus, leaving custom routing to Sound.play', async () => {
    const sound = new Sound('pop', { duration: 0.1, frequency: 600 })
    const capture = mockCtx.createGain()

    await sound.play({ audioContext: mockCtx, destination: capture })

    const voiceGain = mockCtx.gainNodes[mockCtx.gainNodes.length - 1]
    expect(voiceGain.connect).toHaveBeenCalledWith(capture)
  })

  it('reports the output level the meter should show', async () => {
    const manager = new SoundManager({ audioContext: mockCtx }).register('pop', { duration: 0.1, frequency: 600 })
    expect(manager.outputLevel).toBe(0)

    await manager.play('pop')

    const analyser = vi.mocked(mockCtx.createAnalyser).mock.results[0].value
    vi.mocked(analyser.getFloatTimeDomainData).mockImplementation((samples: Float32Array) => {
      samples.fill(0)
      samples[0] = 0.6
    })
    expect(manager.outputLevel).toBeCloseTo(0.6)
  })

  it('releases the bus on dispose so it stops feeding the destination', async () => {
    const manager = new SoundManager({ audioContext: mockCtx }).register('pop', { duration: 0.1, frequency: 600 })
    await manager.play('pop')

    manager.dispose()

    expect(manager.size).toBe(0)
    expect(mockCtx.gainNodes[0].disconnect).toHaveBeenCalled()
  })

  it('handles playing non-existent sound gracefully', async () => {
    const manager = new SoundManager<string>()
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handle = await manager.play('nonexistent')

    expect(handle).toBeNull()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('supports iteration and standard collection methods', () => {
    const manager = new SoundManager()
      .register('tone1', { frequency: 440 })
      .register('tone2', { frequency: 880 })

    expect(Array.from(manager.keys())).toEqual(['tone1', 'tone2'])
    expect(Array.from(manager.values()).map(s => s.name)).toEqual(['tone1', 'tone2'])
    expect(Array.from(manager.entries()).map(([k]) => k)).toEqual(['tone1', 'tone2'])

    const collected: string[] = []
    for (const [name, sound] of manager) {
      collected.push(name)
      expect(sound).toBeInstanceOf(Sound)
    }
    expect(collected).toEqual(['tone1', 'tone2'])

    const forEachCollected: string[] = []
    manager.forEach((sound, name) => {
      forEachCollected.push(name)
      expect(sound).toBeInstanceOf(Sound)
    })
    expect(forEachCollected).toEqual(['tone1', 'tone2'])

    const found = manager.find((s, name) => name === 'tone2')
    expect(found?.name).toBe('tone2')
    expect(manager.find((s, name: string) => name === 'missing')).toBeUndefined()

    const filtered = manager.filter((s, name) => name.startsWith('tone'))
    expect(filtered).toHaveLength(2)
  })

  it('stops and clears all sounds with clear()', () => {
    const manager = new SoundManager()
    manager.register('a', { frequency: 440 })
    manager.register('b', { frequency: 880 })

    expect(manager.size).toBe(2)
    manager.clear()
    expect(manager.size).toBe(0)
  })
})

describe('soundManager audioContext getter', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setAudioContextInstance(null)
  })

  it('reads null rather than creating a context nobody has asked to play on', () => {
    const construct = vi.fn()
    vi.stubGlobal('AudioContext', construct)

    expect(new SoundManager().audioContext).toBeNull()
    expect(construct).not.toHaveBeenCalled()
  })

  it('reads the shared context once one exists', () => {
    const shared = createMockAudioContext()
    setAudioContextInstance(shared)

    expect(new SoundManager().audioContext).toBe(shared)
  })
})
