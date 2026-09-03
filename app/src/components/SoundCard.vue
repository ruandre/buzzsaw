<script setup lang="ts">
import type { SoundDefinition } from '@rjvr/buzzsaw'
import type { DropdownAction } from './ui/DropdownMenu.vue'
import { calculateEffectiveDuration } from '@rjvr/buzzsaw'
import { computed } from 'vue'
import DropdownMenu from './ui/DropdownMenu.vue'
import Tooltip from './ui/Tooltip.vue'
import WaveBadge from './ui/WaveBadge.vue'
import WaveformVisualizer from './WaveformVisualizer.vue'

const props = withDefaults(defineProps<{
  name: string
  definition: SoundDefinition
  isPlaying?: boolean
  isFavorite?: boolean
  showFavorite?: boolean
  /** Grid index for entrance animation delay */
  index?: number
  /** Contextual actions menu items */
  actions?: DropdownAction[]
}>(), {
  isPlaying: false,
  isFavorite: false,
  showFavorite: false,
  index: 0,
  actions: () => [],
})

const emit = defineEmits<{
  (e: 'play', name: string, definition: SoundDefinition): void
  (e: 'stop', name: string): void
  (e: 'toggleFavorite', name: string): void
  (e: 'edit', name: string, definition: SoundDefinition): void
  (e: 'export', name: string, definition: SoundDefinition): void
  (e: 'action', actionId: string, name: string, definition: SoundDefinition): void
}>()

const MAX_STAGGER_STEPS = 8
const STAGGER_MS = 28

const soleAction = computed(() => (props.actions.length === 1 ? props.actions[0] : null))

const staggerDelay = computed(() => `${Math.min(props.index, MAX_STAGGER_STEPS) * STAGGER_MS}ms`)
const durationMs = computed(() => Math.round(calculateEffectiveDuration(props.definition) * 1000))
const pitchLabel = computed(() =>
  typeof props.definition.frequency === 'number'
    ? `${Math.round(props.definition.frequency)} Hz`
    : 'Modulated',
)
</script>

<template>
  <article
    class="sound-card stagger-card hover-lift relative flex flex-col justify-between gap-3.5 border rounded-xl bg-surface p-4.5 shadow-card transition-[border-color,box-shadow,transform] duration-base ease-out sm:p-5"
    :class="isPlaying
      ? 'border-accent ring-1 ring-accent shadow-[0_0_12px_rgb(var(--bs-accent)/0.25)]'
      : 'border-line hover:border-line-strong hover:shadow-card-hover'"
    :style="{ animationDelay: staggerDelay }"
  >
    <div>
      <div class="min-h-6 flex items-center justify-between gap-2">
        <h2 class="truncate text-sm text-ink font-bold leading-none tracking-tight font-sans lg:text-base" :title="name">
          {{ name }}
        </h2>

        <div class="flex flex-shrink-0 items-center gap-1.5">
          <Tooltip v-if="showFavorite" :content="isFavorite ? 'Unstar' : 'Star'">
            <button
              type="button"
              class="flex cursor-pointer items-center justify-center border-0 rounded bg-transparent p-1 transition-[color,transform] duration-fast active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              :class="isFavorite ? 'text-warning' : 'text-ink-subtle hover:text-warning'"
              :aria-label="isFavorite ? `Unstar ${name}` : `Star ${name}`"
              :aria-pressed="isFavorite"
              @click="emit('toggleFavorite', name)"
            >
              <span :class="isFavorite ? 'i-ph-star-fill' : 'i-ph-star-bold'" class="shrink-0 text-sm leading-none" aria-hidden="true" />
            </button>
          </Tooltip>

          <WaveBadge :wave-type="definition.waveType" />
        </div>
      </div>

      <button
        type="button"
        class="mt-3 block w-full cursor-pointer overflow-hidden border-0 rounded-lg bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        :aria-label="`Audition ${name}`"
        @click="isPlaying ? emit('stop', name) : emit('play', name, definition)"
      >
        <WaveformVisualizer :definition="definition" :is-playing="isPlaying" :height="70" :show-readout="false" />
      </button>

      <dl class="mt-2.5 flex items-center justify-between px-0.5 text-xs text-ink-muted leading-none font-mono">
        <div>
          <dt class="sr-only">
            Duration
          </dt>
          <dd class="font-semibold tabular-nums">
            {{ durationMs }}ms
          </dd>
        </div>
        <div>
          <dt class="sr-only">
            Pitch
          </dt>
          <dd class="font-semibold tabular-nums">
            {{ pitchLabel }}
          </dd>
        </div>
      </dl>
    </div>

    <div class="flex items-center justify-between gap-1 border-t border-line-subtle pt-3">
      <button
        type="button"
        class="btn-primary min-w-[4.6rem] py-2"
        :aria-label="`${isPlaying ? 'Stop' : 'Play'} ${name}`"
        @click="isPlaying ? emit('stop', name) : emit('play', name, definition)"
      >
        <span :class="isPlaying ? 'i-ph-stop-fill' : 'i-ph-play-bold'" class="shrink-0 text-xs leading-none" aria-hidden="true" />
        <span>{{ isPlaying ? 'Stop' : 'Play' }}</span>
      </button>

      <div class="flex items-center gap-1">
        <Tooltip content="Edit in synth">
          <button type="button" class="btn-icon" :aria-label="`Edit ${name} in the synthesizer`" @click="emit('edit', name, definition)">
            <span class="i-ph-sliders-bold shrink-0 text-sm leading-none" aria-hidden="true" />
          </button>
        </Tooltip>

        <Tooltip content="Download WAV">
          <button type="button" class="btn-icon" :aria-label="`Download ${name} as a WAV file`" @click="emit('export', name, definition)">
            <span class="i-ph-download-simple-bold shrink-0 text-sm leading-none" aria-hidden="true" />
          </button>
        </Tooltip>

        <Tooltip v-if="soleAction" :content="soleAction.label">
          <button
            type="button"
            class="btn-icon"
            :aria-label="`${soleAction.label} for ${name}`"
            @click="emit('action', soleAction.id, name, definition)"
          >
            <span :class="soleAction.icon" class="shrink-0 text-sm leading-none" aria-hidden="true" />
          </button>
        </Tooltip>

        <DropdownMenu v-else-if="actions.length" :items="actions" @select="id => emit('action', id, name, definition)">
          <button type="button" class="btn-icon" :aria-label="`More actions for ${name}`">
            <span class="i-ph-dots-three-bold shrink-0 text-sm leading-none" aria-hidden="true" />
          </button>
        </DropdownMenu>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* Skips rendering offscreen cards; reserves height for scrollbar stability. */
.sound-card {
  content-visibility: auto;
  contain-intrinsic-size: auto 310px;
}
</style>
