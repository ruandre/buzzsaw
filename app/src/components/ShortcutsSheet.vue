<script setup lang="ts">
import type { Shortcut } from '../composables/useKeyboardShortcuts'
import { computed } from 'vue'
import { SHORTCUTS } from '../composables/useKeyboardShortcuts'
import { useUiStore } from '../stores'
import Modal from './ui/Modal.vue'

const ui = useUiStore()

/** Shortcuts grouped by category for modal display */
const groups = computed(() => {
  const byGroup = new Map<Shortcut['group'], Shortcut[]>()
  for (const shortcut of SHORTCUTS) {
    byGroup.set(shortcut.group, [...(byGroup.get(shortcut.group) ?? []), shortcut])
  }
  return [...byGroup]
})
</script>

<template>
  <Modal
    :open="ui.isShortcutsSheetOpen"
    title="Keyboard shortcuts"
    description="Shortcuts work anywhere outside text fields"
    @update:open="ui.setShortcutsSheetOpen($event)"
  >
    <div class="px-6 py-4.5 space-y-4">
      <section v-for="[group, shortcuts] in groups" :key="group" class="space-y-1.5">
        <h3 class="heading-section">
          {{ group }}
        </h3>
        <ul class="overflow-hidden border border-line rounded-lg shadow-card divide-y divide-line">
          <li
            v-for="shortcut in shortcuts"
            :key="shortcut.keys"
            class="flex items-center justify-between gap-4 bg-surface px-3.5 py-2 text-xs transition-colors duration-fast hover:bg-control-hover sm:text-sm"
          >
            <span class="text-ink font-sans">{{ shortcut.description }}</span>
            <kbd class="flex-shrink-0 border border-line-control rounded-md bg-surface-sunken px-2 py-0.5 text-xs text-ink font-bold font-mono shadow-inset">
              {{ shortcut.keys }}
            </kbd>
          </li>
        </ul>
      </section>
    </div>

    <template #footer>
      <button type="button" class="btn-secondary text-xs" @click="ui.setShortcutsSheetOpen(false)">
        Dismiss
      </button>
    </template>
  </Modal>
</template>
