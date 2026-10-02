import { setAudioContextInstance } from '@rjvr/buzzsaw'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFakeAudioContext } from '../testing/fakeAudioContext'
import { usePlaybackStore } from './playback'

const settle = () => new Promise(resolve => setTimeout(resolve, 0))

describe('playback store voices', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    setAudioContextInstance(createFakeAudioContext())
  })

  afterEach(() => {
    usePlaybackStore().soundManager.dispose()
    setAudioContextInstance(null)
  })

  it('releases a voice once when it is stopped by name', async () => {
    const playback = usePlaybackStore()
    await playback.play('pop')
    await playback.play('tap')

    playback.stop('pop')
    await settle()

    expect(playback.activeVoices).toBe(1)
    expect(playback.isSoundPlaying('tap')).toBe(true)
    expect(playback.isPlaying).toBe(true)
  })
})
