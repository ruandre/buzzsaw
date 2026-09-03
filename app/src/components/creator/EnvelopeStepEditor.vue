<script setup lang="ts">
import type { SoundStep } from '@rjvr/buzzsaw'

withDefaults(defineProps<{
  steps: SoundStep[]
  /** Prefix for unique input IDs and labels */
  idPrefix: string
  /** Label for step value (e.g. Hz or gain) */
  valueLabel: string
  valueUnit?: string
  valueMin: number
  valueMax: number
  valueStep: number
  addLabel: string
  /** Maximum time matching patch duration */
  timeMax: number
}>(), {
  valueUnit: '',
})

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'remove', index: number): void
  (e: 'sort'): void
}>()
</script>

<template>
  <div class="space-y-2.5">
    <ol v-if="steps.length > 0" class="max-h-44 overflow-y-auto pr-1 space-y-2">
      <li v-for="(step, index) in steps" :key="index" class="step-row flex-wrap items-center gap-1.5 p-2 sm:gap-2">
        <span class="w-5 select-none text-xs text-ink-subtle font-bold">#{{ index + 1 }}</span>

        <label :for="`${idPrefix}-value-${index}`" class="sr-only">
          {{ valueLabel }} for step {{ index + 1 }}
        </label>
        <input
          :id="`${idPrefix}-value-${index}`"
          v-model.number="step.value"
          type="number"
          inputmode="decimal"
          :min="valueMin"
          :max="valueMax"
          :step="valueStep"
          class="w-16 border border-line-control rounded-md bg-control px-2 py-1 text-xs text-ink font-bold shadow-inset transition-colors duration-fast sm:w-20 focus:border-accent focus:outline-none"
        >
        <span v-if="valueUnit" class="select-none text-xs text-ink-subtle font-semibold">{{ valueUnit }}</span>

        <span class="select-none text-xs text-ink-subtle font-semibold" aria-hidden="true">@</span>

        <label :for="`${idPrefix}-time-${index}`" class="sr-only">
          Time in seconds for step {{ index + 1 }}
        </label>
        <input
          :id="`${idPrefix}-time-${index}`"
          v-model.number="step.time"
          type="number"
          inputmode="decimal"
          min="0"
          :max="timeMax"
          step="0.01"
          class="w-16 border border-line-control rounded-md bg-control px-2 py-1 text-xs text-ink font-bold shadow-inset transition-colors duration-fast sm:w-18 focus:border-accent focus:outline-none"
          @change="emit('sort')"
        >
        <span class="select-none text-xs text-ink-subtle font-semibold">s</span>

        <button
          type="button"
          class="ml-auto cursor-pointer border-0 rounded-md bg-transparent p-1.5 text-ink-subtle transition-colors duration-fast hover:text-danger-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          :aria-label="`Remove step ${index + 1}`"
          @click="emit('remove', index)"
        >
          <span class="i-ph-trash-bold text-xs" aria-hidden="true" />
        </button>
      </li>
    </ol>

    <p v-else class="border border-line rounded-lg border-dashed bg-surface-muted px-3 py-4 text-center text-xs text-ink-subtle font-mono">
      No steps yet. The value holds flat for the whole sound.
    </p>

    <button type="button" class="btn-secondary w-full py-1.5 text-xs font-mono" @click="emit('add')">
      <span class="i-ph-plus-bold text-xs" aria-hidden="true" />
      <span>{{ addLabel }}</span>
    </button>
  </div>
</template>
