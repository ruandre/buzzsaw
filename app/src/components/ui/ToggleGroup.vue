<script setup lang="ts">
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import { usePlaybackStore } from '../../stores'

export interface ToggleOption {
  value: string
  label: string
  icon?: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  options: ToggleOption[]
  ariaLabel?: string
  size?: 'sm' | 'md'
  responsiveLabels?: boolean
}>(), {
  ariaLabel: 'Options',
  size: 'md',
  responsiveLabels: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const playback = usePlaybackStore()

// Enforces non-empty single selection, preventing unselect
function select(value: unknown): void {
  if (typeof value !== 'string' || !value || value === props.modelValue) {
    return
  }
  playback.cue('select')
  emit('update:modelValue', value)
}

function shouldShowDivider(index: number): boolean {
  if (index === 0) {
    return false
  }
  const prevOption = props.options[index - 1]
  const currOption = props.options[index]
  return props.modelValue !== prevOption.value && props.modelValue !== currOption.value
}
</script>

<template>
  <ToggleGroupRoot
    :model-value="modelValue"
    type="single"
    :aria-label="ariaLabel"
    class="w-full flex items-center justify-between border border-line rounded-lg bg-surface-sunken p-1 shadow-bezel sm:w-auto sm:justify-start"
    @update:model-value="select"
  >
    <template v-for="(option, index) in options" :key="option.value">
      <div
        v-if="index > 0"
        class="h-3.5 w-px shrink-0 transition-opacity duration-fast"
        :class="shouldShowDivider(index) ? 'bg-line-control' : 'opacity-0'"
        aria-hidden="true"
      />
      <ToggleGroupItem
        :value="option.value"
        :aria-label="option.label"
        class="nav-tab min-w-0 flex-1 shrink-0 justify-center gap-1.5 sm:flex-initial"
        :class="size === 'sm' ? 'h-7 px-2 text-xs' : 'h-8.5 px-2.5 sm:px-3 lg:px-3.5 text-xs sm:text-sm font-semibold'"
      >
        <span v-if="option.icon" :class="option.icon" class="shrink-0 text-xs leading-none sm:text-sm" aria-hidden="true" />
        <span class="whitespace-nowrap leading-none" :class="responsiveLabels ? 'hidden sm:inline' : ''">{{ option.label }}</span>
      </ToggleGroupItem>
    </template>
  </ToggleGroupRoot>
</template>
