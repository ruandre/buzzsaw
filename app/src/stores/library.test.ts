import { setAudioContextInstance } from '@rjvr/buzzsaw'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFakeAudioContext } from '../testing/fakeAudioContext'
import { useLibraryStore } from './library'
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

  it('stops offering a deleted sound for playback', () => {
    const library = useLibraryStore()
    library.save('mine', { frequency: 440 })

    library.remove('mine')

    expect(usePlaybackStore().soundManager.has('mine')).toBe(false)
  })
})
