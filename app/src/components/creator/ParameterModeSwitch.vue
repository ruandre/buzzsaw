<script setup lang="ts">
import type { ParameterMode } from '../../stores'

defineProps<{
  modelValue: ParameterMode
  label: string
  /** Label for envelope mode button */
  stepsLabel: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', mode: ParameterMode): void
}>()
</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <span class="select-none text-sm text-ink-muted font-semibold font-mono">{{ label }}</span>
    <div
      class="flex border border-line rounded-lg bg-surface-sunken p-1 text-xs font-semibold font-mono shadow-inset"
      role="group"
      :aria-label="label"
    >
      <button
        type="button"
        class="cursor-pointer border-0 rounded-md px-2.5 py-1 transition-[background-color,color,box-shadow] duration-fast ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        :class="modelValue === 'fixed' ? 'bg-control text-accent-ink shadow-raised' : 'text-ink-muted hover:text-ink'"
        :aria-pressed="modelValue === 'fixed'"
        @click="emit('update:modelValue', 'fixed')"
      >
        Fixed
      </button>
      <button
        type="button"
        class="cursor-pointer border-0 rounded-md px-2.5 py-1 transition-[background-color,color,box-shadow] duration-fast ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        :class="modelValue === 'steps' ? 'bg-control text-accent-ink shadow-raised' : 'text-ink-muted hover:text-ink'"
        :aria-pressed="modelValue === 'steps'"
        @click="emit('update:modelValue', 'steps')"
      >
        {{ stepsLabel }}
      </button>
    </div>
  </div>
</template>
