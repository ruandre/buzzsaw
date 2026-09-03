<script setup lang="ts">
import type { Snippet, SnippetId } from '../snippets'
import { TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { computed, ref, watch } from 'vue'
import { useStudioActions, useSyntaxHighlight, useTransientFlag } from '../composables'
import { usePlaybackStore } from '../stores'
import Modal from './ui/Modal.vue'

const props = defineProps<{
  title: string
  description: string
  /** Dialog remains open while snippets array is non-empty */
  snippets: Snippet[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const COPIED_FEEDBACK_MS = 2000

const playback = usePlaybackStore()
const { copyToClipboard } = useStudioActions()
const { isRaised: justCopied, raise: acknowledgeCopy, lower: clearCopyAcknowledgement }
  = useTransientFlag(COPIED_FEEDBACK_MS)

const activeTab = ref<SnippetId>('core')

const isOpen = computed(() => props.snippets.length > 0)
const activeSnippet = computed(() =>
  props.snippets.find(snippet => snippet.id === activeTab.value) ?? props.snippets[0])

// Resets to first snippet tab and clears copy state on modal open
watch(isOpen, (open) => {
  if (open) {
    activeTab.value = props.snippets[0]?.id ?? 'core'
    clearCopyAcknowledgement()
  }
})

useSyntaxHighlight(activeSnippet)

function selectTab(value: unknown): void {
  if (typeof value !== 'string' || value === activeTab.value) {
    return
  }
  playback.cue('select')
  activeTab.value = value as SnippetId
}

async function copy(): Promise<void> {
  if (!activeSnippet.value) {
    return
  }
  playback.cue('copy')
  if (await copyToClipboard(activeSnippet.value.code, `${activeSnippet.value.label} snippet`)) {
    acknowledgeCopy()
  }
}
</script>

<template>
  <Modal
    :open="isOpen"
    :title="title"
    :description="description"
    size="lg"
    @update:open="value => !value && emit('close')"
  >
    <TabsRoot v-if="snippets.length > 1" :model-value="activeTab" @update:model-value="selectTab">
      <TabsList
        aria-label="Integration format"
        class="flex items-center gap-1.5 overflow-x-auto border-b border-line bg-surface-sunken px-6 pt-2"
      >
        <TabsTrigger
          v-for="snippet in snippets"
          :key="snippet.id"
          :value="snippet.id"
          class="cursor-pointer select-none border-0 border-b-2 border-transparent rounded-t-md px-3.5 py-1.5 text-sm text-ink-muted font-semibold font-mono transition-[color,background-color,border-color] duration-fast data-[state=active]:border-accent data-[state=active]:bg-surface data-[state=active]:text-accent-ink hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          {{ snippet.label }}
        </TabsTrigger>
      </TabsList>
    </TabsRoot>

    <div v-if="activeSnippet" class="max-h-80 overflow-auto bg-surface-muted p-6">
      <pre tabindex="0" class="whitespace-pre text-sm text-ink leading-relaxed font-mono focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"><code :class="`language-${activeSnippet.language}`">{{ activeSnippet.code }}</code></pre>
    </div>

    <template #footer>
      <span class="mr-auto text-xs text-ink-muted font-semibold font-mono">{{ activeSnippet?.hint }}</span>
      <button type="button" class="btn-primary text-xs" aria-label="Copy snippet to clipboard" @click="copy">
        <span :class="justCopied ? 'i-ph-check-bold' : 'i-ph-copy-bold'" class="text-xs" aria-hidden="true" />
        <span>{{ justCopied ? 'Copied' : 'Copy' }}</span>
      </button>
    </template>
  </Modal>
</template>
