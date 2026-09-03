<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
  label?: string
  unit?: string
  /** Custom formatter for value readout */
  formatValue?: (value: number) => string
  ariaLabel?: string
}>(), {
  min: 0,
  max: 100,
  step: 1,
  label: '',
  unit: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const values = computed({
  get: () => [props.modelValue],
  set: ([value]) => value !== undefined && emit('update:modelValue', value),
})

const readout = computed(() =>
  props.formatValue?.(props.modelValue)
  ?? `${props.modelValue}${props.unit ? ` ${props.unit}` : ''}`,
)
</script>

<template>
  <div class="font-mono space-y-1.5">
    <div v-if="label" class="flex items-center justify-between text-xs sm:text-sm">
      <span class="select-none text-ink-muted font-semibold tracking-wide">{{ label }}</span>
      <output class="min-w-[3.75rem] border border-line-control rounded-md bg-surface-sunken px-2 py-0.5 text-right text-xs text-accent-ink font-bold font-mono tabular-nums shadow-inset sm:text-sm">
        {{ readout }}
      </output>
    </div>

    <SliderRoot
      v-model="values"
      :min="min"
      :max="max"
      :step="step"
      class="slider relative h-7 w-full flex cursor-pointer touch-none select-none items-center py-1"
    >
      <SliderTrack class="slider-slot relative h-2 grow overflow-hidden border border-line rounded-full bg-surface-sunken shadow-bezel">
        <div class="gauge-ticks absolute inset-0 opacity-40" aria-hidden="true" />
        <SliderRange class="absolute h-full rounded-full bg-accent" />
      </SliderTrack>

      <SliderThumb
        :aria-label="ariaLabel || label || 'Slider'"
        class="slider-knob thumb slider-thumb relative block h-5 w-5 cursor-grab border rounded-full shadow-control transition-transform duration-fast active:scale-105 active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        <span class="pointer-events-none absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_2px_rgb(var(--bs-accent))]" />
      </SliderThumb>
    </SliderRoot>
  </div>
</template>

<style scoped>
.slider-knob {
  background: radial-gradient(circle at 35% 35%, #ffffff 0%, #eceae4 55%, #d4d0c8 100%);
  border-color: rgb(var(--bs-line-strong));
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.95),
    inset 0 -1px 1px rgba(0, 0, 0, 0.2),
    0 1.5px 4px rgba(0, 0, 0, 0.18);
}

.dark .slider-knob {
  background: radial-gradient(circle at 35% 35%, #535c6a 0%, #353b43 55%, #272c32 100%);
  border-color: rgb(var(--bs-line-strong));
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.25),
    inset 0 -1px 1.5px rgba(0, 0, 0, 0.6),
    0 2px 5px rgba(0, 0, 0, 0.5);
}

.slider-slot {
  box-shadow:
    inset 0 1.5px 3px rgba(0, 0, 0, 0.12),
    inset 0 -0.5px 0.5px rgba(255, 255, 255, 0.8);
}

.dark .slider-slot {
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.65),
    inset 0 -0.5px 0.5px rgba(255, 255, 255, 0.05);
}

@media (pointer: coarse) {
  .slider {
    min-block-size: 44px;
  }

  .thumb {
    inline-size: 24px;
    block-size: 24px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .thumb {
    transition: none !important;
  }
}
</style>
