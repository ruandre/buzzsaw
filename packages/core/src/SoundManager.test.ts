import type { MockAudioContext } from './testing/mockAudioContext'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Sound } from './Sound'
import { SoundManager } from './SoundManager'
import { createMockAudioContext } from './testing/mockAudioContext'

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
    const { DEFAULT_SOUNDS } = await import('./sounds')
    const manager = new SoundManager().registerAll(DEFAULT_SOUNDS)

    expect(manager.size).toBeGreaterThan(50)
    expect(manager.has('ding')).toBe(true)
    expect(manager.has('click')).toBe(true)
  })

  it('registers and retrieves custom sounds', () => {
    const manager = new SoundManager()
    const sound = manager.register('laser', {
      duration: 0.1,
      frequency: 1500,
      waveType: 'sawtooth',
    })

    expect(sound).toBeInstanceOf(Sound)
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

  it('clamps master volume between 0 and 2', () => {
    const manager = new SoundManager({ masterVolume: 1.5 })
    expect(manager.masterVolume).toBe(1.5)

    manager.masterVolume = 3.5
    expect(manager.masterVolume).toBe(2.0)

    manager.masterVolume = -1.0
    expect(manager.masterVolume).toBe(0)
  })

  it('routes a voice through the master bus rather than straight to the speakers', async () => {
    const manager = new SoundManager({ audioContext: mockCtx, masterVolume: 0.8 })
    manager.register('pop', { duration: 0.1, frequency: 600, gain: 0.5 })

    const handle = await manager.play('pop')

    expect(handle).not.toBeNull()
    const [busFader, voiceGain] = mockCtx.gainNodes
    expect(busFader.gain.setTargetAtTime).toHaveBeenCalledWith(0.8, expect.any(Number), expect.any(Number))
    expect(voiceGain.connect).toHaveBeenCalledWith(busFader)
    expect(voiceGain.connect).not.toHaveBeenCalledWith(mockCtx.destination)
  })

  it('builds the bus once and keeps every voice on it', async () => {
    const manager = new SoundManager({ audioContext: mockCtx })
    manager.register('pop', { duration: 0.1, frequency: 600 })

    await manager.play('pop')
    await manager.play('pop')

    expect(mockCtx.gainNodes).toHaveLength(3)
    expect(manager.dispose).toBeInstanceOf(Function)
  })

  it('moves the fader on sounds that are already playing', async () => {
    const manager = new SoundManager({ audioContext: mockCtx })
    manager.register('drone', { duration: 5, frequency: 100 })
    await manager.play('drone')

    manager.masterVolume = 0.25

    const busFader = mockCtx.gainNodes[0]
    expect(busFader.gain.setTargetAtTime).toHaveBeenLastCalledWith(0.25, expect.any(Number), expect.any(Number))
  })

  it('lets a caller take over routing with an explicit destination', async () => {
    const manager = new SoundManager({ audioContext: mockCtx })
    manager.register('pop', { duration: 0.1, frequency: 600 })
    const capture = mockCtx.createGain()

    await manager.play('pop', { destination: capture as unknown as AudioNode })

    const voiceGain = mockCtx.gainNodes[mockCtx.gainNodes.length - 1]
    expect(voiceGain.connect).toHaveBeenCalledWith(capture)
  })

  it('reports the output level the meter should show', async () => {
    const manager = new SoundManager({ audioContext: mockCtx })
    expect(manager.outputLevel).toBe(0)

    manager.register('pop', { duration: 0.1, frequency: 600 })
    await manager.play('pop')

    const analyser = vi.mocked(mockCtx.createAnalyser).mock.results[0].value
    vi.mocked(analyser.getFloatTimeDomainData).mockImplementation((samples: Float32Array) => {
      samples.fill(0)
      samples[0] = 0.6
    })
    expect(manager.outputLevel).toBeCloseTo(0.6)
  })

  it('releases the bus on dispose so it stops feeding the destination', async () => {
    const manager = new SoundManager({ audioContext: mockCtx })
    manager.register('pop', { duration: 0.1, frequency: 600 })
    await manager.play('pop')

    manager.dispose()

    expect(manager.size).toBe(0)
    expect(mockCtx.gainNodes[0].disconnect).toHaveBeenCalled()
  })

  it('handles playing non-existent sound gracefully', async () => {
    const manager = new SoundManager()
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handle = await manager.play('nonexistent')

    expect(handle).toBeNull()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('supports iteration and standard collection methods', () => {
    const manager = new SoundManager()
    manager.register('tone1', { frequency: 440 })
    manager.register('tone2', { frequency: 880 })

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
    expect(manager.find((s, name) => name === 'missing')).toBeUndefined()

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
