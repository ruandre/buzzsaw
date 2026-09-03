<script setup lang="ts">
import type { DocTopicId, PackageManager } from '../docs/content'
import { computed, ref } from 'vue'
import { useStudioActions } from '../composables/useStudioActions'
import {
  DOC_EXAMPLES,
  DOC_TOPICS,
  installCommand,
  PACKAGE_MANAGERS,
} from '../docs/content'
import { usePlaybackStore } from '../stores'
import CodeBlock from './ui/CodeBlock.vue'
import ProseText from './ui/ProseText.vue'
import WaveformVisualizer from './WaveformVisualizer.vue'

const playback = usePlaybackStore()
const { openInCreator } = useStudioActions()

const selectedTopic = ref<DocTopicId | 'all'>('all')
const packageManager = ref<PackageManager>('pnpm')

const visibleTopics = computed(() =>
  selectedTopic.value === 'all'
    ? DOC_TOPICS
    : DOC_TOPICS.filter(topic => topic.id === selectedTopic.value))

const currentInstall = computed(() => installCommand(packageManager.value))

function selectTopic(id: DocTopicId | 'all'): void {
  if (selectedTopic.value === id) {
    return
  }
  playback.cue('select')
  selectedTopic.value = id
}

function selectPackageManager(manager: PackageManager): void {
  if (packageManager.value === manager) {
    return
  }
  playback.cue('select')
  packageManager.value = manager
}
</script>

<template>
  <div class="space-y-6">
    <div class="view-header">
      <div>
        <h1 class="heading-view">
          Documentation
        </h1>
        <p class="text-lede">
          Synthesize, play, and export sounds with the two Buzzsaw packages.
        </p>
      </div>
    </div>

    <div class="xl:flex xl:items-start xl:gap-8">
      <nav
        class="mb-6 flex flex-wrap items-center gap-1.5 border border-line rounded-xl bg-surface-sunken p-2 shadow-bezel xl:sticky xl:top-20 xl:mb-0 xl:w-60 xl:shrink-0 xl:flex-col xl:items-stretch"
        aria-label="Documentation topics"
      >
        <button
          type="button"
          class="nav-tab justify-start"
          :data-state="selectedTopic === 'all' ? 'active' : 'inactive'"
          :aria-pressed="selectedTopic === 'all'"
          @click="selectTopic('all')"
        >
          <span class="i-ph-squares-four-bold shrink-0 text-sm leading-none" aria-hidden="true" />
          <span class="leading-none">Everything</span>
        </button>
        <button
          v-for="topic in DOC_TOPICS"
          :key="topic.id"
          type="button"
          class="nav-tab justify-start"
          :data-state="selectedTopic === topic.id ? 'active' : 'inactive'"
          :aria-pressed="selectedTopic === topic.id"
          @click="selectTopic(topic.id)"
        >
          <span :class="topic.icon" class="shrink-0 text-sm leading-none" aria-hidden="true" />
          <span class="leading-none">{{ topic.label }}</span>
        </button>
      </nav>

      <div class="min-w-0 flex-1 space-y-6">
        <section
          v-for="topic in visibleTopics"
          :key="topic.id"
          class="surface-card p-5 space-y-4 sm:p-6"
          :aria-labelledby="`doc-${topic.id}`"
        >
          <header class="space-y-1">
            <h2 :id="`doc-${topic.id}`" class="flex items-center gap-2 text-base text-ink font-bold font-sans sm:text-lg">
              <span :class="topic.icon" class="text-base text-accent" aria-hidden="true" />
              <span>{{ topic.title }}</span>
            </h2>
            <p class="max-w-[68ch] text-sm text-ink-muted font-sans">
              <ProseText :text="topic.intro" />
            </p>
          </header>

          <template v-for="(block, index) in topic.blocks" :key="index">
            <p v-if="block.kind === 'prose'" class="max-w-[68ch] text-sm text-ink-muted leading-relaxed font-sans">
              <ProseText :text="block.text" />
            </p>

            <CodeBlock v-else-if="block.kind === 'code'" :code="block.code" :language="block.language" />

            <dl v-else-if="block.kind === 'terms'" class="overflow-hidden border border-line rounded-lg divide-y divide-line">
              <div
                v-for="entry in block.terms"
                :key="entry.term"
                class="flex flex-col gap-1 bg-surface-muted px-4 py-3 sm:flex-row sm:gap-4"
              >
                <dt class="w-32 flex-shrink-0 text-sm text-accent-ink font-bold font-mono">
                  {{ entry.term }}
                </dt>
                <dd class="text-sm text-ink-muted font-sans">
                  <ProseText :text="entry.description" />
                </dd>
              </div>
            </dl>

            <div v-else-if="block.kind === 'install'" class="space-y-2.5">
              <div class="flex items-center justify-between gap-3">
                <span class="heading-section">Install</span>
                <div class="flex border border-line rounded-lg bg-surface-sunken p-1 text-xs font-semibold font-mono shadow-inset" role="group" aria-label="Package manager">
                  <button
                    v-for="manager in PACKAGE_MANAGERS"
                    :key="manager"
                    type="button"
                    class="cursor-pointer border-0 rounded-md px-2.5 py-1 uppercase transition-[background-color,color,box-shadow] duration-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                    :class="packageManager === manager ? 'bg-control text-accent-ink shadow-raised' : 'text-ink-muted hover:text-ink'"
                    :aria-pressed="packageManager === manager"
                    @click="selectPackageManager(manager)"
                  >
                    {{ manager }}
                  </button>
                </div>
              </div>

              <CodeBlock :code="currentInstall" language="sh" />
            </div>

            <div v-else-if="block.kind === 'examples'" class="grid grid-cols-1 gap-4 lg:grid-cols-4 sm:grid-cols-2">
              <article
                v-for="example in DOC_EXAMPLES"
                :key="example.name"
                class="flex flex-col gap-2.5 border border-line rounded-lg bg-surface-muted p-3"
              >
                <h3 class="text-sm text-ink font-bold font-mono">
                  {{ example.name }}
                </h3>
                <WaveformVisualizer :definition="example.definition" :is-playing="playback.isSoundPlaying(example.name)" :height="56" />
                <p class="flex-1 text-xs text-ink-muted leading-relaxed font-sans">
                  {{ example.description }}
                </p>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    class="btn-primary flex-1 px-2 py-1 text-xs"
                    :aria-label="`Play ${example.name}`"
                    @click="playback.play(example.name, example.definition)"
                  >
                    <span class="i-ph-play-bold text-xs" aria-hidden="true" />
                    <span>Play</span>
                  </button>
                  <button
                    type="button"
                    class="btn-secondary px-2 py-1 text-xs"
                    :aria-label="`Open ${example.name} in the synthesizer`"
                    @click="openInCreator(example.name, example.definition)"
                  >
                    <span class="i-ph-sliders-bold text-xs" aria-hidden="true" />
                  </button>
                </div>
              </article>
            </div>
          </template>
        </section>
      </div>
    </div>
  </div>
</template>
