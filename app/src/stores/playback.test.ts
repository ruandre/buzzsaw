import { setAudioContextInstance } from '@rjvr/buzzsaw'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFakeAudioContext } from '../testing/fakeAudioContext'
import { useNotificationsStore } from './notifications'
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

  it('reports an invalid definition instead of rejecting', async () => {
    const playback = usePlaybackStore()

    await expect(playback.preview({ frequency: 440, gain: 2 })).resolves.toBeUndefined()

    expect(useNotificationsStore().notices.at(-1)?.tone).toBe('error')
    expect(playback.activeVoices).toBe(0)
  })
})
