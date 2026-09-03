<script setup lang="ts">
import type { GeneratedSound } from '../../stores'
import { isEnvelope } from '@rjvr/buzzsaw'
import { computed, ref, watch } from 'vue'
import { QUICK_TRANSFORMS } from '../../ai/presets'
import { useStudioActions } from '../../composables/useStudioActions'
import { buildSnippets } from '../../snippets'
import { useAiStore, useLibraryStore, usePlaybackStore } from '../../stores'
import CodeSnippetModal from '../CodeSnippetModal.vue'
import ModulePanel from '../ui/ModulePanel.vue'
import Tooltip from '../ui/Tooltip.vue'
import WaveBadge from '../ui/WaveBadge.vue'
import WaveformVisualizer from '../WaveformVisualizer.vue'

const props = defineProps<{
  sound: GeneratedSound | null
}>()

const emit = defineEmits<{
  (e: 'refine', instruction: string): void
}>()

const ai = useAiStore()
const library = useLibraryStore()
const playback = usePlaybackStore()
const { openInCreator, exportWav } = useStudioActions()

const refinement = ref('')
const refinementInput = ref<HTMLInputElement | null>(null)
const isSnippetOpen = ref(false)

const snippets = computed(() =>
  isSnippetOpen.value && props.sound ? buildSnippets(props.sound.name, props.sound.definition) : [])

const pitchSummary = computed(() => {
  const frequency = props.sound?.definition.frequency
  if (typeof frequency === 'number') {
    return `${Math.round(frequency)} Hz`
  }
  if (!isEnvelope(frequency)) {
    return '-'
  }
  const last = frequency.steps.at(-1)
  return last
    ? `${Math.round(frequency.start)} → ${Math.round(last.value)} Hz`
    : `${Math.round(frequency.start)} Hz`
})

const stats = computed(() => {
  const definition = props.sound?.definition
  return [
    { label: 'Pitch', value: pitchSummary.value },
    { label: 'Duration', value: `${Math.round((definition?.duration ?? 0) * 1000)} ms` },
    { label: 'Attack', value: `${((definition?.attack ?? 0) * 1000).toFixed(1)} ms` },
    { label: 'Decay', value: `${Math.round((definition?.decay ?? 0) * 1000)} ms` },
  ]
})

function openSnippet(): void {
  playback.cue('open')
  isSnippetOpen.value = true
}

function refine(instruction = refinement.value): void {
  const text = instruction.trim()
  if (!text || !props.sound || ai.isGenerating) {
    return
  }
  ai.dismissError()
  emit('refine', text)
}

// Retains refinement input on failure for retry; clears on success
watch(() => ai.isGenerating, (running, wasRunning) => {
  if (running || !wasRunning) {
    return
  }
  if (ai.lastError) {
    refinementInput.value?.focus()
    return
  }
  refinement.value = ''
})
</script>

<template>
  <ModulePanel title="Patch" icon="i-ph-waveform-bold">
    <template v-if="sound" #actions>
      <Tooltip content="Play">
        <button type="button" class="btn-icon" :aria-label="`Play ${sound.name}`" @click="playback.play(sound.name, sound.definition)">
          <span class="i-ph-play-bold shrink-0 text-sm leading-none" aria-hidden="true" />
        </button>
      </Tooltip>
      <Tooltip content="Save to library">
        <button type="button" class="btn-icon" :aria-label="`Save ${sound.name}`" @click="library.save(sound.name, sound.definition)">
          <span class="i-ph-floppy-disk-bold shrink-0 text-sm leading-none" aria-hidden="true" />
        </button>
      </Tooltip>
      <Tooltip content="Edit in synth">
        <button type="button" class="btn-icon" :aria-label="`Edit ${sound.name}`" @click="openInCreator(sound.name, sound.definition)">
          <span class="i-ph-sliders-bold shrink-0 text-sm leading-none" aria-hidden="true" />
        </button>
      </Tooltip>
      <Tooltip content="Download WAV">
        <button type="button" class="btn-icon" :aria-label="`Download ${sound.name}`" @click="exportWav(sound.name, sound.definition)">
          <span class="i-ph-download-simple-bold shrink-0 text-sm leading-none" aria-hidden="true" />
        </button>
      </Tooltip>
      <Tooltip content="Get code">
        <button type="button" class="btn-icon" :aria-label="`Get code for ${sound.name}`" @click="openSnippet()">
          <span class="i-ph-code-bold shrink-0 text-sm leading-none" aria-hidden="true" />
        </button>
      </Tooltip>
    </template>

    <div v-if="sound" class="space-y-4">
      <div class="min-w-0 space-y-1">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="truncate text-base text-ink font-bold tracking-tight font-sans">
            {{ sound.name }}
          </h3>
          <WaveBadge :wave-type="sound.definition.waveType" />
          <span class="badge-base border-line text-ink-subtle">
            {{ sound.source === 'model' ? 'On-device model' : 'Offline engine' }}
          </span>
        </div>
        <p class="text-sm text-ink-muted leading-relaxed font-sans">
          {{ sound.description }}
        </p>
      </div>

      <WaveformVisualizer
        :definition="sound.definition"
        :is-playing="playback.isSoundPlaying(sound.name)"
        :height="170"
      />

      <dl class="grid grid-cols-2 gap-2.5 text-xs font-mono sm:grid-cols-4">
        <div v-for="stat in stats" :key="stat.label" class="border border-line rounded-lg bg-surface-muted px-3 py-2">
          <dt class="text-ink-subtle">
            {{ stat.label }}
          </dt>
          <dd class="mt-0.5 text-ink font-bold tabular-nums">
            {{ stat.value }}
          </dd>
        </div>
      </dl>

      <div class="border-t border-line-subtle pt-4 space-y-2.5">
        <form class="min-w-0 flex flex-col gap-2 sm:flex-row sm:items-center" @submit.prevent="refine()">
          <label for="refinement" class="sr-only">Describe a change to this sound</label>
          <input
            id="refinement"
            ref="refinementInput"
            v-model="refinement"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="Make it punchier with a pitch dive..."
            :disabled="ai.isGenerating"
            :aria-invalid="ai.lastError ? 'true' : undefined"
            aria-errormessage="refinement-error"
            class="input-base flex-1 bg-surface-muted font-sans"
            @input="ai.dismissError()"
          >
          <button type="submit" class="btn-secondary shrink-0" :disabled="!refinement.trim() || ai.isGenerating">
            <span class="i-ph-pencil-simple-bold shrink-0 text-sm leading-none" aria-hidden="true" />
            <span>Refine</span>
          </button>
        </form>

        <p
          v-if="ai.lastError"
          id="refinement-error"
          class="flex items-start gap-1.5 text-xs text-danger-ink font-sans"
          role="alert"
        >
          <span class="i-ph-warning-circle-bold mt-px shrink-0 text-sm leading-none" aria-hidden="true" />
          <span>{{ ai.lastError }} The patch is unchanged. Adjust the wording and try again.</span>
        </p>

        <div class="flex flex-wrap gap-1.5" role="group" aria-label="One-click edits">
          <button
            v-for="transform in QUICK_TRANSFORMS"
            :key="transform.label"
            type="button"
            class="chip"
            :disabled="ai.isGenerating"
            @click="refine(transform.prompt)"
          >
            {{ transform.label }}
          </button>
        </div>
      </div>

      <CodeSnippetModal
        :title="`Use \&quot;${sound.name}\&quot;`"
        description="Copy the sound into your project"
        :snippets="snippets"
        @close="isSnippetOpen = false"
      />
    </div>

    <div v-else class="px-6 py-16 text-center space-y-4">
      <div class="mx-auto h-14 w-14 flex items-center justify-center border border-line rounded-xl bg-surface-sunken shadow-inset">
        <span class="i-ph-waveform-bold text-2xl text-accent" aria-hidden="true" />
      </div>
      <div class="mx-auto max-w-sm space-y-1.5">
        <p class="text-base text-ink font-bold font-sans">
          Nothing designed yet
        </p>
        <p class="text-sm text-ink-muted leading-relaxed font-sans">
          Describe a sound and it appears here, ready to audition, refine, and export.
        </p>
      </div>
    </div>
  </ModulePanel>
</template>
