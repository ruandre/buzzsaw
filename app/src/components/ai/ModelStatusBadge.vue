<script setup lang="ts">
import type { PromptApiAvailability } from '../../ai'
import { computed } from 'vue'
import { useAiStore } from '../../stores'

const ai = useAiStore()

// Lamp color and label per availability state
const STATES: Record<PromptApiAvailability, { lamp: string, label: string }> = {
  available: { lamp: 'bg-success', label: 'On-device model ready' },
  downloadable: { lamp: 'bg-warning', label: 'Model not downloaded' },
  downloading: { lamp: 'bg-warning', label: 'Downloading model' },
  unavailable: { lamp: 'bg-ink-subtle', label: 'Offline engine' },
  unsupported: { lamp: 'bg-ink-subtle', label: 'Offline engine' },
}

const state = computed(() => STATES[ai.promptApi.availability])
</script>

<template>
  <div
    class="flex items-center gap-2.5 border border-line rounded-lg bg-surface-sunken px-3 py-2 text-xs font-mono shadow-bezel"
    role="status"
  >
    <span class="relative h-2.5 w-2.5 flex" aria-hidden="true">
      <span v-if="ai.isGenerating" class="absolute h-full w-full inline-flex animate-ping rounded-full bg-accent opacity-75" />
      <span class="relative h-2.5 w-2.5 inline-flex rounded-full" :class="ai.isGenerating ? 'bg-accent' : state.lamp" />
    </span>
    <span class="text-ink font-semibold">{{ ai.isGenerating ? 'Working' : state.label }}</span>
  </div>
</template>
