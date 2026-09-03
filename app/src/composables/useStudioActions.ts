import type { SoundDefinition } from '@rjvr/buzzsaw'
import { WavExporter } from '@rjvr/buzzsaw-wav'
import {
  useAiStore,
  useCreatorStore,
  useLibraryStore,
  useNotificationsStore,
  usePlaybackStore,
  useUiStore,
} from '../stores'

// Cross-store coordination workflows for creator, playback, and library
export function useStudioActions() {
  const ui = useUiStore()
  const creator = useCreatorStore()
  const library = useLibraryStore()
  const playback = usePlaybackStore()
  const notifications = useNotificationsStore()
  const ai = useAiStore()

  /** Loads definition into synthesizer and navigates to creator view */
  function openInCreator(name: string, definition: SoundDefinition): void {
    creator.load(name, definition)
    ui.showView('creator')
  }

  function loadTemplate(id: string): void {
    playback.cue('select')
    creator.loadArchetype(id)
  }

  function saveCreatorPatch(): void {
    library.save(creator.state.name, creator.definition)
  }

  async function exportWav(name: string, definition: SoundDefinition): Promise<void> {
    try {
      await WavExporter.downloadWav(definition, `${name}.wav`)
      playback.cue('export')
      notifications.confirm(`Exported "${name}.wav"`)
    }
    catch (error) {
      console.error('WAV export failed:', error)
      playback.cue('error')
      notifications.reportError(`Could not export "${name}" as WAV.`)
    }
  }

  /** Copies text to clipboard with notification feedback */
  async function copyToClipboard(text: string, label: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      notifications.confirm(`Copied ${label}`)
      return true
    }
    catch {
      playback.cue('error')
      notifications.reportError('The browser blocked clipboard access.')
      return false
    }
  }

  function playRandomPreset(): void {
    const names = Object.keys(library.presets)
    if (names.length === 0) {
      return
    }
    const name = names[Math.floor(Math.random() * names.length)]
    playback.play(name)
    notifications.announce(`Auditioning "${name}"`, 'info', 'polite', 2000)
  }

  /** Applies AI edit instruction to creator patch */
  async function refineCreatorPatchWithAi(instruction: string): Promise<void> {
    const result = await ai.edit(creator.definition, creator.state.name, instruction)
    creator.load(result.name, result.definition)
  }

  return {
    openInCreator,
    loadTemplate,
    saveCreatorPatch,
    exportWav,
    copyToClipboard,
    playRandomPreset,
    refineCreatorPatchWithAi,
  }
}
