import type { SoundDefinition } from '@rjvr/buzzsaw'
import type { UiSound } from '../audio/uiSounds'
import { ensureAudioContextReady, MASTER_VOLUME_MIN, SoundManager } from '@rjvr/buzzsaw'
import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { UI_SOUNDS } from '../audio/uiSounds'
import { useNotificationsStore } from './notifications'

// Deliberately below the library's MASTER_VOLUME_MAX of 2, leaving headroom
export const MAX_MASTER_VOLUME = 1.5

/** SoundManager key for creator preview playback */
export const PREVIEW_SOUND = '__creator_preview__'

const RECENT_LIMIT = 10
const METER_DECAY_PER_FRAME = 0.06

export const usePlaybackStore = defineStore('playback', () => {
  const notifications = useNotificationsStore()

  // Names are dynamic: the studio registers user-authored sounds at runtime
  const soundManager = new SoundManager<string>().registerAll(DEFAULT_SOUNDS)
  const masterVolume = ref(1)
  const isMuted = ref(false)
  const activeVoices = ref(0)
  const activeSoundCounts = ref<Record<string, number>>({})
  const currentSound = ref<string | null>(null)
  const recentlyPlayed = ref<string[]>([])
  const outputLevel = ref(0)

  if (typeof window !== 'undefined') {
    const unlock = () => {
      ensureAudioContextReady().catch(() => { })
      window.removeEventListener('pointerdown', unlock, { capture: true })
      window.removeEventListener('keydown', unlock, { capture: true })
    }
    window.addEventListener('pointerdown', unlock, { capture: true, passive: true })
    window.addEventListener('keydown', unlock, { capture: true, passive: true })
  }

  let meterFrame: number | null = null

  function sampleOutputLevel(): void {
    const peak = soundManager.outputLevel
    outputLevel.value = peak > outputLevel.value
      ? peak
      : Math.max(peak, outputLevel.value - METER_DECAY_PER_FRAME)

    if (activeVoices.value > 0 || outputLevel.value > 0) {
      meterFrame = requestAnimationFrame(sampleOutputLevel)
      return
    }
    meterFrame = null
  }

  function startMetering(): void {
    if (meterFrame === null && typeof requestAnimationFrame === 'function') {
      meterFrame = requestAnimationFrame(sampleOutputLevel)
    }
  }

  /** Level actually sent to the engine; 0 while muted */
  const outputVolume = computed(() => (isMuted.value ? MASTER_VOLUME_MIN : masterVolume.value))
  const isPlaying = computed(() => activeVoices.value > 0)

  function isSoundPlaying(name: string): boolean {
    return (activeSoundCounts.value[name] ?? 0) > 0
  }

  watch(outputVolume, (volume) => {
    soundManager.masterVolume = volume
  }, { immediate: true })

  function setMasterVolume(volume: number): void {
    masterVolume.value = volume
    if (isMuted.value && volume > 0) {
      isMuted.value = false
    }
  }

  function toggleMute(): void {
    isMuted.value = !isMuted.value
    notifications.announce(
      isMuted.value ? 'Muted all audio' : `Unmuted at ${Math.round(masterVolume.value * 100)}%`,
      'info',
      'polite',
    )
  }

  async function schedule(name: string, definition?: SoundDefinition): Promise<void> {
    if (definition) {
      soundManager.register(name, definition)
    }

    try {
      const handle = await soundManager.play(name)
      if (!handle) {
        return
      }

      currentSound.value = name
      activeVoices.value++
      startMetering()
      activeSoundCounts.value = {
        ...activeSoundCounts.value,
        [name]: (activeSoundCounts.value[name] ?? 0) + 1,
      }

      handle.promise.finally(() => {
        releaseVoice(name)
      })
    }
    catch (error) {
      console.error(`Error playing sound "${name}":`, error)
      notifications.reportError(`Could not play "${name}". Browsers block audio until you interact with the page.`)
    }
  }

  /** Registers `definition` first when given; records the name in `recentlyPlayed` */
  async function play(name: string, definition?: SoundDefinition): Promise<void> {
    if (name !== PREVIEW_SOUND) {
      recentlyPlayed.value = [name, ...recentlyPlayed.value.filter(n => n !== name)].slice(0, RECENT_LIMIT)
    }
    await schedule(name, definition)
  }

  /** Plays UI cue sound; ignores call if cue is already sounding */
  function cue(event: UiSound): void {
    const name = UI_SOUNDS[event]
    if (isSoundPlaying(name)) {
      return
    }
    void schedule(name)
  }

  /** Auditions an unsaved definition under `PREVIEW_SOUND`, keeping it out of `recentlyPlayed` */
  async function preview(definition: SoundDefinition): Promise<void> {
    await play(PREVIEW_SOUND, definition)
  }

  function stop(name?: string): void {
    if (name) {
      soundManager.get(name)?.stop()
      if ((activeSoundCounts.value[name] ?? 0) > 0) {
        releaseVoice(name)
      }
    }
    else {
      stopAll()
    }
  }

  function stopAll(): void {
    soundManager.stopAll()
    currentSound.value = null
    activeVoices.value = 0
    activeSoundCounts.value = {}
    notifications.announce('Stopped all sounds', 'info', 'polite')
  }

  function releaseVoice(name: string): void {
    activeVoices.value = Math.max(0, activeVoices.value - 1)
    const currentCount = activeSoundCounts.value[name] ?? 0
    if (currentCount <= 1) {
      const next = { ...activeSoundCounts.value }
      delete next[name]
      activeSoundCounts.value = next
      if (currentSound.value === name) {
        const remaining = Object.keys(next).filter(k => (next[k] ?? 0) > 0)
        currentSound.value = remaining.length > 0 ? remaining[remaining.length - 1] : null
      }
    }
    else {
      activeSoundCounts.value = {
        ...activeSoundCounts.value,
        [name]: currentCount - 1,
      }
    }
    if (activeVoices.value === 0) {
      currentSound.value = null
    }
  }

  return {
    soundManager,
    masterVolume,
    isMuted,
    outputVolume,
    activeVoices,
    activeSoundCounts,
    outputLevel,
    isPlaying,
    isSoundPlaying,
    currentSound,
    recentlyPlayed,
    setMasterVolume,
    toggleMute,
    play,
    cue,
    preview,
    stop,
    stopAll,
  }
})
