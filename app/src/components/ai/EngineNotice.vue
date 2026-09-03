<script setup lang="ts">
import { computed } from 'vue'
import { useAiStore, usePlaybackStore } from '../../stores'

const ai = useAiStore()
const playback = usePlaybackStore()

const headline = computed(() =>
  ai.promptApi.isSupported ? 'Model not loaded yet' : 'Running on the offline engine',
)

function announceToggle(event: Event): void {
  playback.cue((event.currentTarget as HTMLDetailsElement).open ? 'expand' : 'collapse')
}
</script>

<template>
  <details
    v-if="!ai.promptApi.isReady"
    class="engine-notice border border-line rounded-lg bg-surface-muted"
    @toggle="announceToggle"
  >
    <summary class="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs text-ink-muted font-mono">
      <span class="i-ph-info-bold text-sm text-accent" aria-hidden="true" />
      <span class="flex-1">{{ headline }}</span>
      <span class="disclosure-caret i-ph-caret-down-bold text-xs transition-transform duration-fast" aria-hidden="true" />
    </summary>
    <div class="border-t border-line px-3 py-2.5 text-sm text-ink-muted leading-relaxed font-sans space-y-1.5">
      <p>{{ ai.promptApi.message }}</p>
      <p v-if="!ai.promptApi.isSupported">
        Everything on this page still works. The offline engine matches your description against a
        library of synthesis recipes instead of asking a model.
      </p>
    </div>
  </details>
</template>

<style scoped>
/* Hides default disclosure triangle in favor of custom caret */
summary {
  list-style: none;
}

summary::-webkit-details-marker {
  display: none;
}

details[open] .disclosure-caret {
  transform: rotate(180deg);
}
</style>
