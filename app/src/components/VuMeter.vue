<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  /** Peak amplitude leaving the master bus, in [0..1] */
  level: number
  /** Voices sounding, used only to describe the meter to assistive technology */
  activeVoices?: number
}>(), {
  activeVoices: 0,
})

// Calibrated in dB rather than linear amplitude to match perceived loudness
const BARS = [
  { threshold: 0.02, height: 'h-1.5', tone: 'bg-emerald-500', peak: 'shadow-[0_0_4px_rgba(16,185,129,0.8)]' },
  { threshold: 0.05, height: 'h-2', tone: 'bg-emerald-500', peak: 'shadow-[0_0_4px_rgba(16,185,129,0.8)]' },
  { threshold: 0.1, height: 'h-2.5', tone: 'bg-emerald-500', peak: 'shadow-[0_0_4px_rgba(16,185,129,0.8)]' },
  { threshold: 0.18, height: 'h-3', tone: 'bg-emerald-500', peak: 'shadow-[0_0_4px_rgba(16,185,129,0.8)]' },
  { threshold: 0.3, height: 'h-3.5', tone: 'bg-amber-500', peak: 'shadow-[0_0_5px_rgba(245,158,11,0.85)]' },
  { threshold: 0.45, height: 'h-4', tone: 'bg-amber-500', peak: 'shadow-[0_0_5px_rgba(245,158,11,0.85)]' },
  { threshold: 0.65, height: 'h-4.5', tone: 'bg-accent', peak: 'shadow-[0_0_6px_rgba(212,32,24,0.9)]' },
  { threshold: 0.9, height: 'h-3.5', tone: 'bg-accent-solid-deep', peak: 'shadow-[0_0_6px_rgba(168,18,14,0.9)]' },
] as const

const percent = computed(() => Math.round(Math.min(1, Math.max(0, props.level)) * 100))

const label = computed(() => {
  const voices = props.activeVoices
  const voicing = voices === 0 ? 'idle' : `${voices} active voice${voices === 1 ? '' : 's'}`
  return `Engine output at ${percent.value}% of full scale, ${voicing}`
})
</script>

<template>
  <div
    class="meter-housing h-9 flex select-none items-center gap-2 border border-line rounded-lg bg-surface-sunken px-2.5 shadow-bezel"
    role="meter"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="percent"
    :aria-label="label"
  >
    <span class="text-[10px] text-ink-subtle font-bold tracking-wider font-mono uppercase" aria-hidden="true">VU</span>

    <div class="meter-well h-5 flex items-end gap-[3px] rounded px-1.5 py-0.5">
      <span
        v-for="(bar, index) in BARS"
        :key="index"
        class="vu-bar w-[3px] rounded-[0.5px]"
        :class="level >= bar.threshold
          ? [bar.height, bar.tone, bar.peak]
          : ['h-1 vu-bar--idle']"
      />
    </div>

    <span class="text-[10px] text-ink-subtle font-semibold font-mono" aria-hidden="true">dB</span>
  </div>
</template>

<style scoped>
.meter-well {
  background: linear-gradient(180deg, #dcd8cc 0%, #ebe7dc 100%);
  border: 1px solid #c4c0b2;
  box-shadow:
    inset 0 1.5px 2.5px rgba(0, 0, 0, 0.14),
    inset 0 -0.5px 0.5px rgba(255, 255, 255, 0.9);
}

.vu-bar--idle {
  background-color: #9e9a8f;
  opacity: 0.55;
}

.dark .meter-well {
  background: linear-gradient(180deg, #0d0f12 0%, #16191d 100%);
  border: 1px solid #22262c;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.9),
    inset 0 -0.5px 0.5px rgba(255, 255, 255, 0.05);
}

.dark .vu-bar--idle {
  background-color: rgb(var(--bs-line-strong));
  opacity: 0.35;
}

.vu-bar {
  transform-origin: bottom;
  transition:
    height 0.09s var(--ease-out),
    background-color 0.09s ease,
    opacity 0.09s ease;
}

@media (prefers-reduced-motion: reduce) {
  .vu-bar {
    transition: none !important;
  }
}
</style>
