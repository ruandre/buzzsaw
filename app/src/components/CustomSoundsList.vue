<script setup lang="ts">
import type { SoundDefinition } from '@rjvr/buzzsaw'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useStudioActions, useTransientFlag } from '../composables'
import { buildRegisterAllSnippet, buildSnippets } from '../snippets'
import { useLibraryStore, useNotificationsStore, usePlaybackStore } from '../stores'
import CodeSnippetModal from './CodeSnippetModal.vue'
import SoundCard from './SoundCard.vue'

const library = useLibraryStore()
const playback = usePlaybackStore()
const notifications = useNotificationsStore()
const { openInCreator, exportWav } = useStudioActions()

const fileInput = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const isDropTarget = ref(false)
const snippet = ref<{ name: string, definition: SoundDefinition } | null>(null)
const isRegisterCodeOpen = ref(false)

const snippets = computed(() =>
  snippet.value ? buildSnippets(snippet.value.name, snippet.value.definition) : [])

const registerSnippets = computed(() =>
  isRegisterCodeOpen.value ? [buildRegisterAllSnippet(library.customSounds)] : [])

const CONFIRM_WINDOW_MS = 4000

const {
  isRaised: isConfirmingClear,
  raise: armClear,
  lower: disarmClear,
} = useTransientFlag(CONFIRM_WINDOW_MS)

const CARD_ACTIONS = [
  { id: 'duplicate', label: 'Duplicate', icon: 'i-ph-copy-bold' },
  { id: 'code', label: 'Copy code', icon: 'i-ph-code-bold' },
  { id: 'delete', label: 'Delete', icon: 'i-ph-trash-bold', danger: true },
]

const visibleSounds = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return Object.entries(library.customSounds)
    .filter(([name]) => !query || name.toLowerCase().includes(query))
    .sort(([a], [b]) => a.localeCompare(b))
})

function handleAction(actionId: string, name: string, definition: SoundDefinition): void {
  switch (actionId) {
    case 'duplicate':
      library.save(`${name}_copy`, definition)
      break
    case 'code':
      playback.cue('open')
      snippet.value = { name, definition }
      break
    case 'delete':
      library.remove(name)
      break
  }
}

function showRegisterCode(): void {
  playback.cue('open')
  isRegisterCodeOpen.value = true
}

async function importFile(file: File): Promise<void> {
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    notifications.reportError('Sound packs must be .json files.')
    return
  }
  try {
    await library.importPack(await file.text())
  }
  catch {
    // Failure reason announced by library store
  }
}

async function handleFileInput(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    await importFile(file)
  }
  // Resets file input so selecting identical file triggers change event
  input.value = ''
}

function isFileDrag(event: DragEvent): boolean {
  return Boolean(event.dataTransfer?.types.includes('Files'))
}

function handleDragOver(event: DragEvent): void {
  if (isFileDrag(event)) {
    isDropTarget.value = true
  }
}

// Ignores dragleave when pointer moves over child DOM elements
function handleDragLeave(event: DragEvent): void {
  const leftFor = event.relatedTarget as Node | null
  if (!leftFor || !(event.currentTarget as HTMLElement).contains(leftFor)) {
    isDropTarget.value = false
  }
}

async function handleDrop(event: DragEvent): Promise<void> {
  isDropTarget.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    await importFile(file)
  }
}

// Arms button on first click for two-step destructive confirmation
function clearAll(): void {
  if (!isConfirmingClear.value) {
    armClear()
    return
  }
  library.clear()
  disarmClear()
}
</script>

<template>
  <div class="space-y-6">
    <div class="view-header">
      <div>
        <h1 class="heading-view">
          Your Library
        </h1>
        <p class="text-lede">
          Saved in this browser only. Export a pack to move sounds between machines.
        </p>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-2.5" role="group" aria-label="Library actions">
        <label for="sound-pack-file" class="sr-only">Import a sound pack</label>
        <input
          id="sound-pack-file"
          ref="fileInput"
          type="file"
          accept=".json,application/json"
          class="sr-only"
          @change="handleFileInput"
        >

        <button type="button" class="btn-secondary" @click="fileInput?.click()">
          <span class="i-ph-upload-simple-bold shrink-0 text-sm leading-none" aria-hidden="true" />
          <span>Import</span>
        </button>

        <button
          type="button"
          class="btn-secondary"
          :disabled="!library.hasCustomSounds"
          @click="library.exportPack()"
        >
          <span class="i-ph-download-simple-bold shrink-0 text-sm leading-none" aria-hidden="true" />
          <span>Export all</span>
        </button>

        <button
          type="button"
          class="btn-secondary"
          :disabled="!library.hasCustomSounds"
          :aria-label="`Show the code that registers all ${library.customSoundCount} saved sounds`"
          @click="showRegisterCode()"
        >
          <span class="i-ph-code-bold shrink-0 text-sm leading-none" aria-hidden="true" />
          <span>Register code</span>
        </button>

        <button
          v-if="library.hasCustomSounds"
          type="button"
          :class="isConfirmingClear ? 'btn-danger' : 'btn-danger-secondary'"
          :aria-label="isConfirmingClear
            ? `Confirm deleting all ${library.customSoundCount} saved sounds`
            : 'Delete all saved sounds'"
          @click="clearAll"
        >
          <span class="i-ph-trash-bold shrink-0 text-sm leading-none" aria-hidden="true" />
          <span>{{ isConfirmingClear ? 'Delete everything?' : 'Clear all' }}</span>
        </button>

        <RouterLink to="/synth" class="btn-primary no-underline">
          <span class="i-ph-plus-bold shrink-0 text-sm leading-none" aria-hidden="true" />
          <span>New sound</span>
        </RouterLink>
      </div>
    </div>

    <div
      class="relative"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <div
        v-if="!library.hasCustomSounds"
        class="border border-line rounded-xl border-dashed bg-surface px-6 py-16 text-center space-y-4"
      >
        <div class="mx-auto h-14 w-14 flex items-center justify-center border border-line rounded-xl bg-surface-sunken shadow-inset">
          <span class="i-ph-folder-plus-bold text-2xl text-accent" aria-hidden="true" />
        </div>
        <div class="mx-auto max-w-sm space-y-1.5">
          <h2 class="text-base text-ink font-bold">
            Nothing saved yet
          </h2>
          <p class="text-sm text-ink-muted leading-relaxed font-sans">
            Build a sound in the synthesizer, or drop a
            <code class="rounded bg-accent/10 px-1 py-0.5 text-accent-ink font-bold font-mono">.json</code>
            pack anywhere in this panel.
          </p>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <RouterLink to="/synth" class="btn-primary no-underline">
            <span class="i-ph-sliders-bold text-xs" aria-hidden="true" />
            <span>Open synthesizer</span>
          </RouterLink>
          <button type="button" class="btn-secondary" @click="fileInput?.click()">
            <span class="i-ph-upload-simple-bold text-xs" aria-hidden="true" />
            <span>Choose a file</span>
          </button>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <div class="relative max-w-xs flex-1">
            <label for="library-search" class="sr-only">Search your library</label>
            <span class="i-ph-magnifying-glass-bold pointer-events-none absolute left-3.5 top-1/2 text-xs text-ink-subtle -translate-y-1/2" aria-hidden="true" />
            <input
              id="library-search"
              v-model="searchQuery"
              type="search"
              placeholder="Search saved sounds..."
              class="input-base py-1.5 pl-9 pr-3"
            >
          </div>
          <span class="select-none text-sm text-ink-muted font-semibold font-mono" role="status" aria-live="polite">
            {{ visibleSounds.length }} of {{ library.customSoundCount }}
          </span>
        </div>

        <div class="grid grid-cols-1 gap-5 2xl:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4">
          <SoundCard
            v-for="([name, definition], index) in visibleSounds"
            :key="name"
            :name="name"
            :definition="definition"
            :is-playing="playback.isSoundPlaying(name)"
            :index="index"
            :actions="CARD_ACTIONS"
            @play="playback.play"
            @stop="playback.stop"
            @edit="openInCreator"
            @export="exportWav"
            @action="handleAction"
          />
        </div>
      </div>

      <Transition name="dropzone">
        <div
          v-if="isDropTarget"
          class="dropzone pointer-events-none absolute inset-0 z-30 flex items-center justify-center border-2 border-accent rounded-xl border-dashed bg-canvas/85 backdrop-blur-sm"
          aria-hidden="true"
        >
          <div class="flex flex-col items-center gap-2.5 px-6 text-center">
            <span class="h-12 w-12 flex items-center justify-center border border-line rounded-xl bg-surface shadow-card">
              <span class="i-ph-download-simple-bold text-xl text-accent" />
            </span>
            <p class="text-base text-ink font-bold font-sans">
              Drop to import
            </p>
            <p class="text-xs text-ink-muted font-mono">
              JSON sound packs only
            </p>
          </div>
        </div>
      </Transition>
    </div>

    <CodeSnippetModal
      :title="`Use \&quot;${snippet?.name ?? ''}\&quot;`"
      description="Copy the sound into your project"
      :snippets="snippets"
      @close="snippet = null"
    />

    <CodeSnippetModal
      title="Register your library"
      description="The engine ships empty. This registers every sound you have saved."
      :snippets="registerSnippets"
      @close="isRegisterCodeOpen = false"
    />
  </div>
</template>

<style scoped>
.dropzone-enter-active,
.dropzone-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out);
}

.dropzone-enter-from,
.dropzone-leave-to {
  opacity: 0;
}
</style>
