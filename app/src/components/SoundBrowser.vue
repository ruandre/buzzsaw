<script setup lang="ts">
import type { SoundDefinition } from '@rjvr/buzzsaw'
import type { CategoryFilter } from '../audio/categories'
import { calculateEffectiveDuration } from '@rjvr/buzzsaw'
import { refDebounced } from '@vueuse/core'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { CATEGORY_FILTERS, countByCategory, getSoundCategory } from '../audio/categories'
import { useStudioActions } from '../composables/useStudioActions'
import { buildSnippets } from '../snippets'
import { useLibraryStore, usePlaybackStore } from '../stores'
import CodeSnippetModal from './CodeSnippetModal.vue'
import SoundCard from './SoundCard.vue'
import Select from './ui/Select.vue'
import ToggleGroup from './ui/ToggleGroup.vue'
import Tooltip from './ui/Tooltip.vue'

type SortKey = 'name-asc' | 'name-desc' | 'duration-asc' | 'duration-desc' | 'wave'

const library = useLibraryStore()
const playback = usePlaybackStore()
const { openInCreator, exportWav, playRandomPreset } = useStudioActions()

const searchQuery = ref('')
const category = ref<CategoryFilter>('all')
const waveFilter = ref('all')
const sortKey = ref<SortKey>('name-asc')

const snippet = ref<{ name: string, definition: SoundDefinition } | null>(null)

const snippets = computed(() =>
  snippet.value ? buildSnippets(snippet.value.name, snippet.value.definition) : [])

const WAVE_FILTERS = [
  { value: 'all', label: 'All', icon: 'i-ph-waveform-bold' },
  { value: 'sine', label: 'Sine', icon: 'i-ph-wave-sine-bold' },
  { value: 'square', label: 'Square', icon: 'i-ph-wave-square-bold' },
  { value: 'sawtooth', label: 'Saw', icon: 'i-ph-wave-sawtooth-bold' },
  { value: 'triangle', label: 'Triangle', icon: 'i-ph-wave-triangle-bold' },
]

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A-Z)', icon: 'i-ph-sort-ascending-bold' },
  { value: 'name-desc', label: 'Name (Z-A)', icon: 'i-ph-sort-descending-bold' },
  { value: 'duration-asc', label: 'Shortest first', icon: 'i-ph-timer-bold' },
  { value: 'duration-desc', label: 'Longest first', icon: 'i-ph-timer-bold' },
  { value: 'wave', label: 'Waveform', icon: 'i-ph-waveform-bold' },
]

const CARD_ACTIONS = [
  { id: 'code', label: 'Copy code', icon: 'i-ph-code-bold' },
]

const ANNOUNCE_SETTLE_MS = 500

type Entry = [string, SoundDefinition]

// Preset sort comparator functions
const COMPARATORS: Record<SortKey, (a: Entry, b: Entry) => number> = {
  'name-asc': ([a], [b]) => a.localeCompare(b),
  'name-desc': ([a], [b]) => b.localeCompare(a),
  'duration-asc': ([, a], [, b]) => calculateEffectiveDuration(a) - calculateEffectiveDuration(b),
  'duration-desc': ([, a], [, b]) => calculateEffectiveDuration(b) - calculateEffectiveDuration(a),
  'wave': ([, a], [, b]) => (a.waveType ?? 'sine').localeCompare(b.waveType ?? 'sine'),
}

const counts = computed(() =>
  countByCategory(Object.keys(library.presets), library.favorites.length))

const categoryOptions = computed(() =>
  CATEGORY_FILTERS.map(filter => ({
    value: filter.id,
    label: `${filter.label} (${counts.value[filter.id]})`,
    icon: filter.id === 'favorites' ? 'i-ph-star-fill text-accent' : undefined,
  })))

const hasActiveFilters = computed(() =>
  Boolean(searchQuery.value) || category.value !== 'all' || waveFilter.value !== 'all')

const visiblePresets = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return Object.entries(library.presets)
    .filter(([name, definition]) => {
      const matchesQuery = !query || name.toLowerCase().includes(query)
      const matchesWave = waveFilter.value === 'all' || (definition.waveType ?? 'sine') === waveFilter.value
      const matchesCategory
        = category.value === 'all'
          || (category.value === 'favorites' ? library.isFavorite(name) : getSoundCategory(name) === category.value)
      return matchesQuery && matchesWave && matchesCategory
    })
    .sort(COMPARATORS[sortKey.value])
})

const resultSummary = computed(() =>
  `${visiblePresets.value.length} ${visiblePresets.value.length === 1 ? 'preset' : 'presets'}`)

// Debounces live region summary to avoid announcing per keystroke
const announcedSummary = refDebounced(resultSummary, ANNOUNCE_SETTLE_MS)

const emptyMessage = computed(() => {
  if (category.value === 'favorites' && library.favorites.length === 0) {
    return 'No starred presets yet. Use the star on any card to add one.'
  }
  if (searchQuery.value) {
    return `Nothing matches "${searchQuery.value}".`
  }
  return 'No presets match these filters.'
})

function resetFilters(): void {
  playback.cue('undo')
  searchQuery.value = ''
  category.value = 'all'
  waveFilter.value = 'all'
}

function clearSearch(): void {
  playback.cue('undo')
  searchQuery.value = ''
}

function handleAction(actionId: string, name: string, definition: SoundDefinition): void {
  if (actionId === 'code') {
    playback.cue('open')
    snippet.value = { name, definition }
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="view-header">
      <div>
        <h1 class="heading-view">
          Preset Library
        </h1>
        <p class="text-lede">
          {{ Object.keys(library.presets).length }} synthesized effects. Audition one, then take it as code or a WAV file.
        </p>
      </div>

      <div class="flex flex-shrink-0 items-center gap-2.5">
        <Tooltip content="Play a random preset">
          <button type="button" class="btn-primary" @click="playRandomPreset">
            <span class="i-ph-dice-five-bold shrink-0 text-sm leading-none" aria-hidden="true" />
            <span>Surprise me</span>
          </button>
        </Tooltip>

        <RouterLink to="/synth" class="btn-secondary no-underline">
          <span class="i-ph-sliders-bold shrink-0 text-sm leading-none" aria-hidden="true" />
          <span>Synthesizer</span>
        </RouterLink>
      </div>
    </div>

    <search class="surface-card p-3.5 sm:p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative min-w-0 w-full lg:max-w-lg sm:max-w-md sm:flex-1">
          <label for="preset-search" class="sr-only">Search presets</label>
          <span class="i-ph-magnifying-glass-bold pointer-events-none absolute left-3.5 top-1/2 text-sm text-ink-subtle -translate-y-1/2" aria-hidden="true" />
          <input
            id="preset-search"
            v-model="searchQuery"
            type="search"
            autocomplete="off"
            spellcheck="false"
            placeholder="Search sounds (chime, pop, laser...)"
            class="input-base py-2 pl-9.5 pr-12 text-sm"
          >
          <div class="absolute right-3 top-1/2 flex items-center -translate-y-1/2">
            <button
              v-if="searchQuery"
              type="button"
              class="cursor-pointer border-0 bg-transparent p-1 text-ink-subtle transition-colors duration-fast hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              aria-label="Clear search"
              @click="clearSearch"
            >
              <span class="i-ph-x-bold text-xs" aria-hidden="true" />
            </button>
            <kbd v-else class="hidden select-none border border-line rounded bg-surface-sunken px-1.5 py-0.5 text-xs text-ink-subtle font-bold font-mono sm:inline">
              /
            </kbd>
          </div>
        </div>

        <div class="min-w-0 w-full shrink-0 sm:w-auto">
          <ToggleGroup
            v-model="waveFilter"
            :options="WAVE_FILTERS"
            aria-label="Filter by waveform"
            size="md"
            :responsive-labels="true"
          />
        </div>
      </div>
    </search>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3.5">
        <div class="grid grid-cols-2 gap-2 sm:flex sm:items-end sm:gap-3.5">
          <div class="min-w-0 flex flex-col gap-1">
            <label for="preset-sort" class="select-none text-xs text-ink-muted font-bold tracking-wider font-mono uppercase">Sort</label>
            <Select
              id="preset-sort"
              v-model="sortKey"
              :options="SORT_OPTIONS"
              aria-label="Sort presets"
              class="w-full sm:w-auto"
            />
          </div>

          <div class="min-w-0 flex flex-col gap-1">
            <label for="preset-category" class="select-none text-xs text-ink-muted font-bold tracking-wider font-mono uppercase">Category</label>
            <Select
              id="preset-category"
              v-model="category"
              :options="categoryOptions"
              aria-label="Filter by category"
              class="w-full sm:w-auto"
            />
          </div>
        </div>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="filter-reset"
          @click="resetFilters"
        >
          <span class="i-ph-arrow-counter-clockwise-bold text-xs" aria-hidden="true" />
          <span>Reset filters</span>
        </button>
      </div>

      <p class="text-xs text-ink-muted font-mono sm:self-end sm:pb-1 sm:text-sm">
        <span class="text-ink font-semibold">{{ visiblePresets.length }}</span>
        {{ visiblePresets.length === 1 ? ' preset' : ' presets' }}
      </p>
    </div>

    <p class="sr-only" role="status">
      {{ announcedSummary }}
    </p>

    <div
      v-if="visiblePresets.length === 0"
      class="border border-line rounded-xl border-dashed bg-surface px-6 py-16 text-center space-y-3"
    >
      <p class="text-base text-ink font-semibold font-sans">
        {{ emptyMessage }}
      </p>
      <p class="mx-auto max-w-sm text-sm text-ink-muted font-sans">
        Try a different search, clear the waveform filter, or build the sound yourself in the synthesizer.
      </p>
      <div class="flex flex-wrap items-center justify-center gap-2 pt-1">
        <button type="button" class="btn-secondary text-sm" @click="resetFilters">
          Clear filters
        </button>
        <RouterLink to="/synth" class="btn-secondary text-sm no-underline">
          Open synthesizer
        </RouterLink>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 gap-5 2xl:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4">
      <SoundCard
        v-for="([name, definition], index) in visiblePresets"
        :key="name"
        :name="name"
        :definition="definition"
        :is-playing="playback.isSoundPlaying(name)"
        :is-favorite="library.isFavorite(name)"
        :show-favorite="true"
        :index="index"
        :actions="CARD_ACTIONS"
        @play="playback.play"
        @stop="playback.stop"
        @toggle-favorite="library.toggleFavorite"
        @edit="openInCreator"
        @export="exportWav"
        @action="handleAction"
      />
    </div>

    <CodeSnippetModal
      :title="`Use \&quot;${snippet?.name ?? ''}\&quot;`"
      description="Copy the sound into your project"
      :snippets="snippets"
      @close="snippet = null"
    />
  </div>
</template>
