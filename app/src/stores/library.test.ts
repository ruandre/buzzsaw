import { setAudioContextInstance } from '@rjvr/buzzsaw'
import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeAudioContext } from '../testing/fakeAudioContext'
import { sanitizeSoundMap, useLibraryStore } from './library'
import { usePlaybackStore } from './playback'

describe('library store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    setAudioContextInstance(createFakeAudioContext())
  })

  afterEach(() => {
    usePlaybackStore().soundManager.dispose()
    setAudioContextInstance(null)
  })

  it('makes a saved sound playable by name', () => {
    const library = useLibraryStore()

    library.save('mine', { frequency: 440 })

    expect(usePlaybackStore().soundManager.has('mine')).toBe(true)
  })

  it('returns the name it saved a sound under', () => {
    const library = useLibraryStore()

    expect(library.save('  mine  ', { frequency: 440 })).toBe('mine')
  })

  it('keeps an invalid definition out of the library', () => {
    const library = useLibraryStore()

    const saved = library.save('loud', { frequency: 440, gain: 2 })

    expect(saved).toBeNull()
    expect(library.customSounds).not.toHaveProperty('loud')
    expect(usePlaybackStore().soundManager.has('loud')).toBe(false)
  })

  it('saves under a renamed key rather than replacing a preset', () => {
    const library = useLibraryStore()

    const saved = library.save('pop', { frequency: 440 })

    expect(saved).toBe('pop_custom')
    expect(usePlaybackStore().soundManager.get('pop')?.definition).toEqual(DEFAULT_SOUNDS.pop)
  })

  it('keeps the preset playable after deleting a sound that shared its name', () => {
    const library = useLibraryStore()
    const saved = library.save('pop', { frequency: 440 })!

    library.remove(saved)

    expect(usePlaybackStore().soundManager.has('pop')).toBe(true)
  })

  it('renames imported sounds that share a preset name', async () => {
    const library = useLibraryStore()

    await library.importPack(JSON.stringify({ version: 1, sounds: { tap: { frequency: 440 } } }))

    expect(library.customSounds).toHaveProperty('tap_custom')
    expect(usePlaybackStore().soundManager.get('tap')?.definition).toEqual(DEFAULT_SOUNDS.tap)
  })

  it('skips imported sounds with invalid names', async () => {
    const library = useLibraryStore()

    const result = await library.importPack(JSON.stringify({
      '': { frequency: 440 },
      'bad!': { frequency: 440 },
      'mine': { frequency: 440 },
    }))

    expect(result).toEqual({ imported: 1, skipped: 2 })
    expect(Object.keys(library.customSounds)).toEqual(['mine'])
  })

  it('persists nothing when registering an imported sound fails', async () => {
    const library = useLibraryStore()
    vi.spyOn(usePlaybackStore().soundManager, 'register').mockImplementation(() => {
      throw new TypeError('Invalid sound name provided.')
    })

    await expect(library.importPack(JSON.stringify({ mine: { frequency: 440 } }))).rejects.toThrow(TypeError)

    expect(library.customSounds).toEqual({})
  })

  it('stops offering a deleted sound for playback', () => {
    const library = useLibraryStore()
    library.save('mine', { frequency: 440 })

    library.remove('mine')

    expect(usePlaybackStore().soundManager.has('mine')).toBe(false)
  })
})

describe('sanitizeSoundMap', () => {
  it('drops a stored sound with an empty name', () => {
    const sounds = sanitizeSoundMap({ '': { frequency: 440 }, 'mine': { frequency: 440 } })

    expect(Object.keys(sounds)).toEqual(['mine'])
  })

  it('keeps a stored sound whose name the save form would reject', () => {
    const sounds = sanitizeSoundMap({ 'kick.v2': { frequency: 440 } })

    expect(sounds).toHaveProperty(['kick.v2'])
  })
})
