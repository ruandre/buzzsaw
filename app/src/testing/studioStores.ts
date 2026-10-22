import { setAudioContextInstance } from '@rjvr/buzzsaw'
import { createPinia, setActivePinia } from 'pinia'
import { usePlaybackStore } from '../stores'
import { createFakeAudioContext } from './fakeAudioContext'

/** Fresh Pinia and a running fake audio context; returns the teardown */
export function installStudioStores(): () => void {
  setActivePinia(createPinia())
  setAudioContextInstance(createFakeAudioContext())
  return () => {
    usePlaybackStore().soundManager.dispose()
    setAudioContextInstance(null)
  }
}
