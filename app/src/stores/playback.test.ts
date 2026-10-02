import { setAudioContextInstance } from '@rjvr/buzzsaw'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
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
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    onTestFinished(() => consoleError.mockRestore())
    const playback = usePlaybackStore()

    await expect(playback.preview({ frequency: 440, gain: 2 })).resolves.toBeUndefined()

    expect(useNotificationsStore().notices.at(-1)?.tone).toBe('error')
    expect(playback.activeVoices).toBe(0)
    expect(consoleError).toHaveBeenCalledOnce()
  })

  it('auditions an unsaved definition without replacing the saved sound it is named after', async () => {
    const playback = usePlaybackStore()
    playback.soundManager.register('laser', { frequency: 300 })

    await playback.audition('laser', { frequency: 1200 })

    expect(playback.soundManager.get('laser')?.definition.frequency).toBe(300)
    expect(playback.isSoundPlaying('laser')).toBe(true)
    expect(playback.currentSound).toBe('laser')
  })

  it('stops an audition by its name', async () => {
    const playback = usePlaybackStore()
    await playback.audition('laser', { frequency: 1200 })

    playback.stop('laser')
    await settle()

    expect(playback.isSoundPlaying('laser')).toBe(false)
    expect(playback.activeVoices).toBe(0)
  })

  it('stops an audition with every other voice', async () => {
    const playback = usePlaybackStore()
    await playback.audition('laser', { frequency: 1200 })

    playback.stopAll()

    expect([...playback.soundManager.values()].some(sound => sound.isPlaying)).toBe(false)
  })

  it('keeps auditions out of recently played, which replays by name', async () => {
    const playback = usePlaybackStore()

    await playback.audition('laser', { frequency: 1200 })

    expect(playback.recentlyPlayed).not.toContain('laser')
  })
})
