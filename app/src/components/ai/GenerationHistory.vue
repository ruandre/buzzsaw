<script setup lang="ts">
import type { GeneratedSound } from '../../stores'
import { useAiStore, usePlaybackStore } from '../../stores'
import ModulePanel from '../ui/ModulePanel.vue'

defineProps<{
  /** Active history entry ID displayed in result panel */
  activeId: string | null
}>()

const emit = defineEmits<{
  (e: 'select', entry: GeneratedSound): void
}>()

const ai = useAiStore()
const playback = usePlaybackStore()

function discard(id: string): void {
  playback.cue('discard')
  ai.removeFromHistory(id)
}

function discardAll(): void {
  playback.cue('undo')
  ai.clearHistory()
}
</script>

<template>
  <ModulePanel v-if="ai.hasHistory" :title="`Recent (${ai.history.length})`" icon="i-ph-clock-counter-clockwise-bold">
    <template #actions>
      <button
        type="button"
        class="cursor-pointer module-meta border-0 rounded-md bg-transparent px-1.5 py-1 text-ink-muted transition-colors duration-fast -mx-1.5 -my-1 hover:bg-control-active hover:text-danger-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        @click="discardAll"
      >
        Clear all
      </button>
    </template>

    <ul class="space-y-1.5">
      <li
        v-for="entry in ai.history"
        :key="entry.id"
        class="flex items-center gap-1.5 border rounded-lg px-3 py-2 transition-[border-color,background-color] duration-fast"
        :class="activeId === entry.id
          ? 'border-accent bg-accent/5'
          : 'border-line bg-surface-muted hover:border-line-strong'"
      >
        <button
          type="button"
          class="min-w-0 flex-1 cursor-pointer border-0 rounded bg-transparent py-0.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          :aria-label="`Show and play ${entry.name}`"
          @click="emit('select', entry)"
        >
          <span class="block truncate text-sm text-ink font-semibold leading-snug font-sans">{{ entry.name }}</span>
          <span class="block truncate text-xs text-ink-subtle leading-tight font-mono">{{ entry.prompt }}</span>
        </button>
        <button
          type="button"
          class="shrink-0 cursor-pointer border-0 rounded-md bg-transparent p-1.5 text-ink-subtle transition-colors duration-fast -mr-1.5 hover:text-danger-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          :aria-label="`Remove ${entry.name} from history`"
          @click="discard(entry.id)"
        >
          <span class="i-ph-x-bold block shrink-0 text-xs leading-none" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </ModulePanel>
</template>
