import { beforeEach, describe, expect, it } from 'vitest'
import { Sound } from './Sound'
import { createMockAudioContext } from './testing/mockAudioContext'

describe('sound class', () => {
  let mockCtx: BaseAudioContext

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

    const handle = await sound.play({ audioContext: mockCtx as AudioContext })
    expect(mockCtx.createOscillator).toHaveBeenCalled()
    expect(mockCtx.createGain).toHaveBeenCalled()
    expect(handle.isPlaying).toBe(true)

    handle.stop()
    expect(handle.isPlaying).toBe(false)
  })

  it('stops all active handles when sound.stop() is called', async () => {
    const sound = new Sound('beep', { duration: 0.5, frequency: 440 })
    await sound.play({ audioContext: mockCtx as AudioContext })
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
})
