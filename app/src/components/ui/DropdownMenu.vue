<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import { usePlaybackStore } from '../../stores'

export interface DropdownAction {
  id: string
  label: string
  icon?: string
  shortcut?: string
  /** Styles item as destructive action */
  danger?: boolean
}

withDefaults(defineProps<{
  items: DropdownAction[]
  align?: 'start' | 'center' | 'end'
}>(), {
  align: 'end',
})

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const playback = usePlaybackStore()

function announceOpen(open: boolean): void {
  if (open) {
    playback.cue('open')
  }
}
</script>

<template>
  <DropdownMenuRoot @update:open="announceOpen">
    <DropdownMenuTrigger as-child>
      <slot />
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent :align="align" :side-offset="4" class="popover popover-panel min-w-[11rem]">
        <template v-for="(item, index) in items" :key="item.id">
          <DropdownMenuSeparator v-if="item.danger && index > 0" class="my-1 h-px bg-line" />
          <DropdownMenuItem
            class="popover-item"
            :class="item.danger ? 'text-danger-ink hover:bg-danger-wash' : 'hover:text-accent'"
            @select="emit('select', item.id)"
          >
            <span class="flex items-center gap-2">
              <span v-if="item.icon" :class="item.icon" class="text-xs" aria-hidden="true" />
              <span>{{ item.label }}</span>
            </span>
            <kbd v-if="item.shortcut" class="ml-auto rounded bg-surface-sunken px-1.5 py-0.5 text-xs text-ink-subtle font-semibold font-mono">
              {{ item.shortcut }}
            </kbd>
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<style scoped>
@import './popover.css';
</style>
