<script setup lang="ts">
import { ref } from 'vue'
import { INSPIRATION_PROMPTS } from '../../ai/presets'
import { useAiStore, usePlaybackStore } from '../../stores'
import ModulePanel from '../ui/ModulePanel.vue'
import EngineNotice from './EngineNotice.vue'

const emit = defineEmits<{
  (e: 'submit', prompt: string): void
  (e: 'cancel'): void
}>()

const ai = useAiStore()
const playback = usePlaybackStore()

const description = ref('')

function submit(text = description.value): void {
  const prompt = text.trim()
  if (!prompt || ai.isGenerating) {
    return
  }
  description.value = prompt
  emit('submit', prompt)
}

function surpriseMe(): void {
  playback.cue('randomize')
  submit(INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)].prompt)
}
</script>

<template>
  <ModulePanel title="Describe a sound" icon="i-ph-magic-wand-bold" tone="bay">
    <div class="space-y-4">
      <form class="space-y-2.5" @submit.prevent="submit()">
        <label for="sound-description" class="sr-only">Describe the sound you want</label>
        <textarea
          id="sound-description"
          v-model="description"
          rows="3"
          autocomplete="off"
          spellcheck="false"
          placeholder="A crystal bell chime with a long resonant tail..."
          :disabled="ai.isGenerating"
          class="input-base resize-y bg-surface-muted leading-relaxed font-sans"
          @keydown.enter.exact.prevent="submit()"
        />

        <div class="flex items-center gap-2">
          <button
            v-if="ai.isGenerating"
            type="button"
            class="btn-secondary flex-1"
            @click="emit('cancel')"
          >
            <span class="i-ph-x-bold shrink-0 text-sm leading-none" aria-hidden="true" />
            <span>Cancel</span>
          </button>
          <button
            v-else
            type="submit"
            class="btn-primary flex-1"
            :disabled="!description.trim()"
          >
            <span class="i-ph-magic-wand-bold shrink-0 text-sm leading-none" aria-hidden="true" />
            <span>Design</span>
          </button>

          <button
            type="button"
            class="btn-secondary shrink-0"
            :disabled="ai.isGenerating"
            @click="surpriseMe"
          >
            <span class="i-ph-dice-five-bold shrink-0 text-sm leading-none" aria-hidden="true" />
            <span>Surprise me</span>
          </button>
        </div>
      </form>

      <div v-if="ai.isGenerating" class="space-y-1.5" role="status" aria-live="polite">
        <p class="text-xs text-ink-muted font-mono">
          {{ ai.statusText }}
        </p>
        <div
          v-if="ai.downloadPercent !== null"
          class="h-1.5 overflow-hidden border border-line rounded-full bg-surface shadow-inset"
          role="progressbar"
          :aria-valuenow="ai.downloadPercent"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Model download progress"
        >
          <div class="h-full rounded-full bg-accent transition-[width] duration-base" :style="{ width: `${ai.downloadPercent}%` }" />
        </div>
      </div>

      <div v-else class="space-y-2">
        <span class="block heading-section">Try one of these</span>
        <div class="flex flex-wrap gap-1.5" role="group" aria-label="Prompt suggestions">
          <button
            v-for="suggestion in INSPIRATION_PROMPTS"
            :key="suggestion.label"
            type="button"
            class="chip"
            :title="suggestion.prompt"
            @click="submit(suggestion.prompt)"
          >
            {{ suggestion.label }}
          </button>
        </div>
      </div>

      <EngineNotice />
    </div>
  </ModulePanel>
</template>
