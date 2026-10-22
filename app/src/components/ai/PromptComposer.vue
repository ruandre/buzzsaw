<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { INSPIRATION_PROMPTS } from '../../ai/presets'
import { useRetainedFocus } from '../../composables/useRetainedFocus'
import { useAiStore, usePlaybackStore } from '../../stores'
import ModulePanel from '../ui/ModulePanel.vue'
import EngineNotice from './EngineNotice.vue'
import StepTimer from './StepTimer.vue'

const emit = defineEmits<{
  (e: 'submit', prompt: string): void
  (e: 'cancel'): void
}>()

const ai = useAiStore()
const playback = usePlaybackStore()

const IME_PROCESS_KEY_CODE = 229

const description = ref('')
const composer = useTemplateRef<HTMLElement>('composer')
const descriptionInput = useTemplateRef<HTMLTextAreaElement>('descriptionInput')

useRetainedFocus(() => ai.isGenerating, composer, descriptionInput)

function submit(text = description.value): void {
  const prompt = text.trim()
  if (!prompt || ai.isGenerating) {
    return
  }
  description.value = prompt
  emit('submit', prompt)
}

// Enter also confirms an IME candidate; Safari reports that keystroke as keyCode 229 instead of isComposing
function submitOnEnter(event: KeyboardEvent): void {
  if (event.isComposing || event.keyCode === IME_PROCESS_KEY_CODE) {
    return
  }
  event.preventDefault()
  submit()
}

function surpriseMe(): void {
  playback.cue('randomize')
  submit(INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)].prompt)
}
</script>

<template>
  <ModulePanel title="Describe a sound" icon="i-ph-magic-wand-bold" tone="bay">
    <div ref="composer" class="space-y-4">
      <form class="space-y-2.5" @submit.prevent="submit()">
        <label for="sound-description" class="sr-only">Describe the sound you want</label>
        <textarea
          id="sound-description"
          ref="descriptionInput"
          v-model="description"
          rows="3"
          autocomplete="off"
          spellcheck="false"
          placeholder="A crystal bell chime with a long resonant tail..."
          :readonly="ai.isGenerating"
          class="input-base resize-y bg-surface-muted leading-relaxed font-sans"
          @keydown.enter.exact="submitOnEnter"
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
        <div class="flex items-baseline justify-between gap-3 text-xs text-ink-muted font-mono">
          <p>{{ ai.statusText }}</p>
          <StepTimer :key="ai.statusText" />
        </div>
        <div
          class="h-1.5 overflow-hidden border border-line rounded-full bg-surface shadow-inset"
          role="progressbar"
          :aria-valuenow="ai.downloadPercent ?? undefined"
          :aria-valuetext="ai.statusText"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Generation progress"
        >
          <div
            v-if="ai.downloadPercent !== null"
            class="h-full rounded-full bg-accent transition-[width] duration-base"
            :style="{ width: `${ai.downloadPercent}%` }"
          />
          <div v-else class="progress-sweep h-full w-2/5 rounded-full bg-accent" />
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

<style scoped>
.progress-sweep {
  animation: progress-sweep 1.4s ease-in-out infinite;
}

@keyframes progress-sweep {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(250%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .progress-sweep {
    animation: none;
    width: 100%;
    opacity: 0.4;
  }
}
</style>
