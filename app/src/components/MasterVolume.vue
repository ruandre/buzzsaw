<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { computed } from 'vue'
import { MAX_MASTER_VOLUME, usePlaybackStore } from '../stores'
import Tooltip from './ui/Tooltip.vue'

withDefaults(defineProps<{
  /** Display variant: compact (header) or full (drawer) */
  variant?: 'compact' | 'full'
}>(), {
  variant: 'compact',
})

const playback = usePlaybackStore()

const values = computed({
  get: () => [playback.masterVolume],
  set: ([value]) => value !== undefined && playback.setMasterVolume(value),
})

const percentLabel = computed(() =>
  playback.isMuted ? 'Muted' : `${Math.round(playback.masterVolume * 100)}%`,
)

const speakerIcon = computed(() => {
  if (playback.isMuted || playback.masterVolume === 0) {
    return 'i-ph-speaker-x-bold text-accent'
  }
  return playback.masterVolume < 0.5 ? 'i-ph-speaker-low-bold' : 'i-ph-speaker-high-bold'
})
</script>

<template>
  <div
    class="flex items-center gap-2 border border-line rounded-lg bg-surface-sunken shadow-bezel"
    :class="variant === 'full' ? 'w-full px-3 py-2' : 'h-9 px-3'"
  >
    <Tooltip :content="playback.isMuted ? 'Unmute' : 'Mute'" shortcut="M">
      <button
        type="button"
        class="h-6 w-6 flex shrink-0 cursor-pointer items-center justify-center border-0 rounded bg-transparent p-0 text-ink-muted transition-colors duration-fast hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        :aria-label="playback.isMuted ? 'Unmute master volume' : 'Mute master volume'"
        :aria-pressed="playback.isMuted"
        @click="playback.toggleMute()"
      >
        <span :class="speakerIcon" class="shrink-0 text-sm leading-none" aria-hidden="true" />
      </button>
    </Tooltip>

    <SliderRoot
      v-model="values"
      :min="0"
      :max="MAX_MASTER_VOLUME"
      :step="0.05"
      class="relative h-5 flex cursor-pointer touch-none select-none items-center"
      :class="variant === 'full' ? 'flex-1' : 'w-20'"
    >
      <SliderTrack class="volume-slot relative h-2 grow overflow-hidden border border-line rounded-full bg-surface-sunken">
        <div class="gauge-ticks absolute inset-0 opacity-40" aria-hidden="true" />
        <SliderRange class="absolute h-full rounded-full bg-accent" />
      </SliderTrack>
      <SliderThumb
        aria-label="Master volume"
        class="volume-knob slider-thumb relative block h-4 w-4 border rounded-full shadow-control transition-transform duration-fast active:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        :class="variant === 'full' ? 'h-5 w-5' : ''"
      >
        <span class="pointer-events-none absolute inset-0 m-auto h-1 w-1 rounded-full bg-accent" />
      </SliderThumb>
    </SliderRoot>

    <span
      v-if="variant === 'compact'"
      class="w-10 text-right text-xs text-ink-muted font-bold leading-none font-mono tabular-nums"
      aria-hidden="true"
    >{{ percentLabel }}</span>
  </div>
</template>

<style scoped>
.volume-knob {
  background: radial-gradient(circle at 35% 35%, #ffffff 0%, #eceae4 55%, #d4d0c8 100%);
  border-color: rgb(var(--bs-line-strong));
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.95),
    inset 0 -1px 1px rgba(0, 0, 0, 0.2),
    0 1px 3px rgba(0, 0, 0, 0.15);
}

.dark .volume-knob {
  background: radial-gradient(circle at 35% 35%, #535c6a 0%, #353b43 55%, #272c32 100%);
  border-color: rgb(var(--bs-line-strong));
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.25),
    inset 0 -1px 1.5px rgba(0, 0, 0, 0.6),
    0 1.5px 3px rgba(0, 0, 0, 0.45);
}

.volume-slot {
  box-shadow:
    inset 0 1.5px 3px rgba(0, 0, 0, 0.12),
    inset 0 -0.5px 0.5px rgba(255, 255, 255, 0.8);
}

.dark .volume-slot {
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.65),
    inset 0 -0.5px 0.5px rgba(255, 255, 255, 0.05);
}
</style>
