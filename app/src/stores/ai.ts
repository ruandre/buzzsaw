import type { SoundDefinition } from '@rjvr/buzzsaw'
import type { DesignedSound, PromptApiStatus } from '../ai'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { checkPromptApiAvailability, designSound, redesignSound } from '../ai'
import { toCustomSoundName } from '../audio/soundName'
import { restoreSoundDefinition } from '../audio/storedSound'
import { STORAGE_KEYS, usePersistedState } from '../utils/storage'
import { useLibraryStore } from './library'
import { useNotificationsStore } from './notifications'
import { usePlaybackStore } from './playback'

export interface GeneratedSound {
  id: string
  name: string
  description: string
  definition: SoundDefinition
  prompt: string
  source: DesignedSound['source']
  createdAt: number
}

export interface GenerateOptions {
  signal?: AbortSignal
  saveToLibrary?: boolean
}

const HISTORY_LIMIT = 30

// Prompt API emits no availability-change event, so downloads are polled
const DOWNLOAD_POLL_MS = 2000

const CHECKING_STATUS: PromptApiStatus = {
  availability: 'unsupported',
  isSupported: false,
  isReady: false,
  message: 'Checking for a built-in AI model...',
}

export const useAiStore = defineStore('ai', () => {
  const notifications = useNotificationsStore()
  const playback = usePlaybackStore()
  const library = useLibraryStore()

  const promptApi = ref<PromptApiStatus>(CHECKING_STATUS)
  const isGenerating = ref(false)
  const statusText = ref('')
  const lastError = ref<string | null>(null)
  const downloadPercent = ref<number | null>(null)

  const history = usePersistedState<GeneratedSound[]>(
    STORAGE_KEYS.aiHistory,
    [],
    sanitizeHistory,
  )
  const latest = ref<GeneratedSound | null>(history.value[0] ?? null)
  const hasHistory = computed(() => history.value.length > 0)

  let downloadPoll: ReturnType<typeof setTimeout> | undefined

  async function refreshAvailability(): Promise<PromptApiStatus> {
    promptApi.value = await checkPromptApiAvailability()
    clearTimeout(downloadPoll)
    if (promptApi.value.availability === 'downloading') {
      downloadPoll = setTimeout(refreshAvailability, DOWNLOAD_POLL_MS)
    }
    return promptApi.value
  }

  /** Rejects, changing nothing, while another generate or edit runs */
  async function generate(description: string, options: GenerateOptions = {}): Promise<GeneratedSound> {
    return run(
      () => designSound(description, { signal: options.signal, onProgress: reportProgress }),
      description,
      options,
    )
  }

  /** Rejects, changing nothing, while another generate or edit runs */
  async function edit(
    original: SoundDefinition,
    originalName: string,
    instruction: string,
    options: GenerateOptions = {},
  ): Promise<GeneratedSound> {
    return run(
      () => redesignSound(original, originalName, instruction, {
        signal: options.signal,
        onProgress: reportProgress,
      }),
      `Edited "${originalName}": ${instruction}`,
      options,
    )
  }

  function removeFromHistory(id: string): void {
    history.value = history.value.filter(entry => entry.id !== id)
    if (latest.value?.id === id) {
      latest.value = history.value[0] ?? null
    }
    notifications.announce('Removed from history', 'info', 'polite', 2000)
  }

  function clearHistory(): void {
    history.value = []
    latest.value = null
    notifications.announce('Cleared generation history', 'info', 'polite')
  }

  async function run(
    design: () => Promise<DesignedSound>,
    prompt: string,
    options: GenerateOptions,
  ): Promise<GeneratedSound> {
    // Runs share status, error and cancel state; WebMCP tools bypass the UI's own guard
    if (isGenerating.value) {
      throw new Error('Buzzsaw is already designing a sound; try again when it finishes.')
    }
    isGenerating.value = true
    statusText.value = 'Preparing...'
    downloadPercent.value = null
    lastError.value = null

    try {
      const designed = await design()
      const entry: GeneratedSound = {
        id: `ai-${designed.designedAt}-${Math.floor(Math.random() * 1000)}`,
        name: toCustomSoundName(designed.name),
        description: designed.description,
        definition: designed.definition,
        prompt,
        source: designed.source,
        createdAt: designed.designedAt,
      }

      latest.value = entry
      history.value = [entry, ...history.value].slice(0, HISTORY_LIMIT)

      const savedAs = options.saveToLibrary ? library.saveAsNew(entry.name, entry.definition) : null
      await (savedAs ? playback.play(savedAs) : playback.audition(entry.name, entry.definition))

      notifications.confirm(
        `Created "${entry.name}" ${entry.source === 'model' ? 'with the on-device model' : 'with the offline engine'}`,
      )
      return entry
    }
    catch (error) {
      reportFailure(error, options.signal)
      throw error
    }
    finally {
      isGenerating.value = false
      statusText.value = ''
      downloadPercent.value = null
      // Generation may have downloaded the model
      void refreshAvailability()
    }
  }

  function reportProgress(message: string, percent?: number): void {
    statusText.value = message
    downloadPercent.value = percent ?? null
  }

  function reportFailure(error: unknown, signal?: AbortSignal): void {
    if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
      notifications.announce('Generation cancelled', 'info', 'polite', 2000)
      return
    }
    lastError.value = error instanceof Error ? error.message : 'Sound generation failed.'
    playback.cue('error')
    notifications.reportError(lastError.value)
  }

  function dismissError(): void {
    lastError.value = null
  }

  return {
    promptApi,
    isGenerating,
    statusText,
    downloadPercent,
    lastError,
    dismissError,
    history,
    hasHistory,
    latest,
    refreshAvailability,
    generate,
    edit,
    removeFromHistory,
    clearHistory,
  }
})

export function sanitizeHistory(raw: unknown): GeneratedSound[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.flatMap((entry) => {
    const definition = restoreSoundDefinition(entry?.definition)
    if (!definition || typeof entry.id !== 'string' || typeof entry.name !== 'string') {
      return []
    }
    // Migrates entries generated before preset names were reserved
    return [{ ...entry, definition, name: toCustomSoundName(entry.name) }]
  }).slice(0, HISTORY_LIMIT)
}
