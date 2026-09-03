import type { SoundDefinition } from '@rjvr/buzzsaw'
import type { DesignedSound, PromptApiStatus } from '../ai'
import { isValidSoundDefinition } from '@rjvr/buzzsaw'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { checkPromptApiAvailability, designSound, redesignSound } from '../ai'
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

  async function refreshAvailability(): Promise<PromptApiStatus> {
    promptApi.value = await checkPromptApiAvailability()
    return promptApi.value
  }

  async function generate(description: string, options: GenerateOptions = {}): Promise<GeneratedSound> {
    return run(
      () => designSound(description, { signal: options.signal, onProgress: reportProgress }),
      description,
      options,
    )
  }

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
    isGenerating.value = true
    statusText.value = 'Preparing...'
    downloadPercent.value = null
    lastError.value = null

    try {
      const designed = await design()
      const entry: GeneratedSound = {
        id: `ai-${designed.designedAt}-${Math.floor(Math.random() * 1000)}`,
        name: designed.name,
        description: designed.description,
        definition: designed.definition,
        prompt,
        source: designed.source,
        createdAt: designed.designedAt,
      }

      latest.value = entry
      history.value = [entry, ...history.value].slice(0, HISTORY_LIMIT)

      if (options.saveToLibrary) {
        library.save(entry.name, entry.definition)
      }
      await playback.play(entry.name, entry.definition)

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

function sanitizeHistory(raw: unknown): GeneratedSound[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .filter((entry): entry is GeneratedSound =>
      Boolean(entry)
      && typeof entry.id === 'string'
      && typeof entry.name === 'string'
      && isValidSoundDefinition(entry.definition),
    )
    .slice(0, HISTORY_LIMIT)
}
