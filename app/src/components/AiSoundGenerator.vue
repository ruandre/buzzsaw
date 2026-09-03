<script setup lang="ts">
import type { GeneratedSound } from '../stores'
import { computed, onUnmounted, ref } from 'vue'
import { useAiStore, usePlaybackStore } from '../stores'
import GenerationHistory from './ai/GenerationHistory.vue'
import ModelStatusBadge from './ai/ModelStatusBadge.vue'
import PromptComposer from './ai/PromptComposer.vue'
import SoundResultPanel from './ai/SoundResultPanel.vue'

const ai = useAiStore()
const playback = usePlaybackStore()

const selected = ref<GeneratedSound | null>(null)

let inFlight: AbortController | null = null

const active = computed(() => selected.value ?? ai.latest)

function beginRun(): AbortSignal {
  inFlight?.abort()
  inFlight = new AbortController()
  return inFlight.signal
}

async function generate(prompt: string): Promise<void> {
  try {
    selected.value = await ai.generate(prompt, { signal: beginRun() })
  }
  catch {
    // Failure reason announced by ai store
  }
  finally {
    inFlight = null
  }
}

async function refine(instruction: string): Promise<void> {
  if (!active.value) {
    return
  }

  try {
    selected.value = await ai.edit(
      active.value.definition,
      active.value.name,
      instruction,
      { signal: beginRun() },
    )
  }
  catch {
    // Failure reason announced by ai store
  }
  finally {
    inFlight = null
  }
}

function abortRun(): void {
  inFlight?.abort()
  inFlight = null
}

function cancel(): void {
  if (!inFlight) {
    return
  }
  playback.cue('dismiss')
  abortRun()
}

function replay(entry: GeneratedSound): void {
  selected.value = entry
  playback.play(entry.name, entry.definition)
}

onUnmounted(abortRun)
</script>

<template>
  <div class="space-y-6">
    <div class="view-header">
      <div>
        <h1 class="heading-view">
          AI Sound Design
        </h1>
        <p class="text-lede">
          Describe a sound in plain language. Everything runs on this device. No prompt leaves the browser.
        </p>
      </div>
      <ModelStatusBadge />
    </div>

    <div class="grid grid-cols-1 min-w-0 items-start gap-5 lg:grid-cols-12">
      <PromptComposer
        class="min-w-0 lg:col-span-5 lg:col-start-1 lg:row-start-1"
        @submit="generate"
        @cancel="cancel"
      />

      <div class="workbench-rail min-w-0 lg:col-span-7 lg:row-span-2 lg:col-start-6 lg:row-start-1">
        <SoundResultPanel :sound="active" @refine="refine" />
      </div>

      <GenerationHistory
        class="min-w-0 lg:col-span-5 lg:col-start-1 lg:row-start-2"
        :active-id="active?.id ?? null"
        @select="replay"
      />
    </div>
  </div>
</template>
