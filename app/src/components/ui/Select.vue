<script setup lang="ts" generic="T extends string">
import {
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { usePlaybackStore } from '../../stores'

const props = withDefaults(defineProps<{
  modelValue: T
  options: readonly { value: T, label: string, icon?: string }[]
  placeholder?: string
  ariaLabel?: string
  id?: string
}>(), {
  placeholder: 'Select...',
  ariaLabel: 'Select an option',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()

const playback = usePlaybackStore()

function announceOpen(open: boolean): void {
  if (open) {
    playback.cue('open')
  }
}

// Resolved through options so the emitted value keeps its literal type
function select(value: unknown): void {
  const option = props.options.find(candidate => candidate.value === value)
  if (!option || option.value === props.modelValue) {
    return
  }
  playback.cue('select')
  emit('update:modelValue', option.value)
}
</script>

<template>
  <SelectRoot :model-value="modelValue" @update:model-value="select" @update:open="announceOpen">
    <SelectTrigger
      :id="id"
      :aria-label="ariaLabel"
      class="btn-secondary min-w-[8.75rem] justify-between gap-2 py-1.5 font-mono"
    >
      <SelectValue :placeholder="placeholder" />
      <SelectIcon class="text-ink-subtle">
        <span class="i-ph-caret-down-bold text-xs" aria-hidden="true" />
      </SelectIcon>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent position="popper" :side-offset="4" class="popover popover-panel min-w-[9.375rem]">
        <SelectViewport class="p-0.5">
          <SelectGroup>
            <SelectItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              class="popover-item hover:bg-control-hover data-[state=checked]:text-accent hover:text-accent data-[state=checked]:font-semibold"
            >
              <span class="flex items-center gap-2">
                <span v-if="option.icon" :class="option.icon" class="shrink-0 text-sm leading-none" aria-hidden="true" />
                <SelectItemText>{{ option.label }}</SelectItemText>
              </span>
              <SelectItemIndicator class="ml-2 text-accent">
                <span class="i-ph-check-bold shrink-0 text-sm leading-none" aria-hidden="true" />
              </SelectItemIndicator>
            </SelectItem>
          </SelectGroup>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<style scoped>
@import './popover.css';
</style>
