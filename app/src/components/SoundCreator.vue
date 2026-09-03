<script setup lang="ts">
import { computed, ref } from 'vue'
import { SOUND_NAME_PATTERN, SOUND_NAME_RULE } from '../audio/soundName'
import { useStudioActions } from '../composables/useStudioActions'
import { buildSnippets } from '../snippets'
import { PREVIEW_SOUND, useCreatorStore, usePlaybackStore } from '../stores'
import CodeSnippetModal from './CodeSnippetModal.vue'
import EnvelopePanel from './creator/EnvelopePanel.vue'
import OscillatorPanel from './creator/OscillatorPanel.vue'
import PatchSourceBar from './creator/PatchSourceBar.vue'
import PitchPanel from './creator/PitchPanel.vue'
import ModulePanel from './ui/ModulePanel.vue'
import Tooltip from './ui/Tooltip.vue'
import WaveformVisualizer from './WaveformVisualizer.vue'

const creator = useCreatorStore()
const playback = usePlaybackStore()
const { saveCreatorPatch, exportWav } = useStudioActions()

const isSnippetOpen = ref(false)

const snippets = computed(() =>
  isSnippetOpen.value ? buildSnippets(creator.state.name, creator.definition) : [])

const isAuditioning = computed(() => playback.currentSound === PREVIEW_SOUND)

function resetPatch(): void {
  playback.cue('undo')
  creator.reset()
}

function openSnippet(): void {
  playback.cue('open')
  isSnippetOpen.value = true
}

function randomizePatch(): void {
  playback.cue('randomize')
  creator.randomize()
}
</script>

<template>
  <div class="space-y-6">
    <div class="view-header">
      <div>
        <h1 class="heading-view">
          Synthesizer
        </h1>
        <p class="text-lede">
          Shape an oscillator, envelope, and pitch contour, then hear it immediately.
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2.5">
        <Tooltip content="Randomize parameters" shortcut="R">
          <button type="button" class="btn-secondary" @click="randomizePatch()">
            <span class="i-ph-dice-five-bold shrink-0 text-sm leading-none" aria-hidden="true" />
            <span>Randomize</span>
          </button>
        </Tooltip>

        <button type="button" class="btn-secondary" @click="resetPatch()">
          <span class="i-ph-arrow-counter-clockwise-bold shrink-0 text-sm leading-none" aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 min-w-0 items-start gap-5 lg:grid-cols-12">
      <div class="workbench-rail min-w-0 lg:col-span-7 space-y-5">
        <ModulePanel title="Oscilloscope" icon="i-ph-waveform-bold" tone="bay">
          <template #actions>
            <Tooltip content="Save to library">
              <button type="button" class="btn-icon" aria-label="Save this patch to the library" @click="saveCreatorPatch()">
                <span class="i-ph-floppy-disk-bold shrink-0 text-sm leading-none" aria-hidden="true" />
              </button>
            </Tooltip>
            <Tooltip content="Download WAV">
              <button type="button" class="btn-icon" aria-label="Download this patch as a WAV file" @click="exportWav(creator.state.name, creator.definition)">
                <span class="i-ph-download-simple-bold shrink-0 text-sm leading-none" aria-hidden="true" />
              </button>
            </Tooltip>
            <Tooltip content="Get code">
              <button type="button" class="btn-icon" aria-label="Get code for this patch" @click="openSnippet()">
                <span class="i-ph-code-bold shrink-0 text-sm leading-none" aria-hidden="true" />
              </button>
            </Tooltip>
          </template>

          <div class="space-y-4">
            <div class="patch-name flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <span class="relative h-2.5 w-2.5 flex shrink-0" aria-hidden="true">
                <span v-if="isAuditioning" class="absolute h-full w-full inline-flex animate-ping rounded-full bg-accent opacity-75" />
                <span class="relative h-2.5 w-2.5 inline-flex rounded-full bg-accent shadow-[0_0_6px_rgb(var(--bs-accent))]" />
              </span>
              <label for="patch-name" class="select-none text-sm text-ink-muted font-semibold font-mono">Patch</label>
              <input
                id="patch-name"
                v-model="creator.state.name"
                type="text"
                required
                :pattern="SOUND_NAME_PATTERN"
                autocomplete="off"
                spellcheck="false"
                placeholder="soundName"
                aria-errormessage="patch-name-error"
                class="input-base max-w-xs flex-1 py-1.5 font-bold user-invalid:border-danger"
              >
              <span id="patch-name-error" class="patch-name-error basis-full text-xs text-danger-ink font-mono">
                {{ SOUND_NAME_RULE }}
              </span>
            </div>

            <WaveformVisualizer :definition="creator.definition" :is-playing="isAuditioning" :height="260" />

            <button
              type="button"
              class="btn-primary w-full py-2.5 font-bold tracking-wide"
              aria-label="Audition the current patch"
              @click="playback.preview(creator.definition)"
            >
              <span class="i-ph-play-bold shrink-0 text-sm leading-none" aria-hidden="true" />
              <span>Audition</span>
              <kbd class="hidden select-none rounded bg-black/25 px-1.5 py-0.5 text-xs font-mono opacity-90 sm:inline">Space</kbd>
            </button>
          </div>
        </ModulePanel>

        <PatchSourceBar />
      </div>

      <div class="grid grid-cols-1 min-w-0 items-start gap-5 lg:col-span-5 lg:grid-cols-1 sm:grid-cols-2">
        <OscillatorPanel />
        <EnvelopePanel />
        <PitchPanel class="lg:col-span-1 sm:col-span-2" />
      </div>
    </div>

    <CodeSnippetModal
      :title="`Use \&quot;${creator.state.name}\&quot;`"
      description="Copy the sound into your project"
      :snippets="snippets"
      @close="isSnippetOpen = false"
    />
  </div>
</template>

<style scoped>
/* Shown when input matches :user-invalid state */
.patch-name-error {
  display: none;
}

.patch-name:has(input:user-invalid) .patch-name-error {
  display: block;
}
</style>
