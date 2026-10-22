<script setup lang="ts">
import { NumberFieldInput, NumberFieldRoot } from 'reka-ui'

defineOptions({ inheritAttrs: false })

defineProps<{
  modelValue: number
  id: string
  min: number
  max: number
  step: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

// Committed values round to this precision; presets carry up to 4 decimals
const FORMAT_OPTIONS: Intl.NumberFormatOptions = { maximumFractionDigits: 4, useGrouping: false }

// A cleared field commits undefined; keep the last valid value instead
function emitFinite(value: number | undefined): void {
  if (typeof value === 'number' && Number.isFinite(value)) {
    emit('update:modelValue', value)
  }
}
</script>

<template>
  <NumberFieldRoot
    :id="id"
    :model-value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :step-snapping="false"
    :format-options="FORMAT_OPTIONS"
    @update:model-value="emitFinite"
  >
    <NumberFieldInput
      v-bind="$attrs"
      class="border border-line-control rounded-md shadow-inset transition-colors duration-fast focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    />
  </NumberFieldRoot>
</template>
