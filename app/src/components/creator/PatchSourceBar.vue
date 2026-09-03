<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { QUICK_TRANSFORMS } from '../../ai/presets'
import { ARCHETYPES } from '../../audio/archetypes'
import { useStudioActions } from '../../composables/useStudioActions'
import { useAiStore, useCreatorStore } from '../../stores'
import ModulePanel from '../ui/ModulePanel.vue'
import ToggleGroup from '../ui/ToggleGroup.vue'

type Source = 'describe' | 'refine' | 'template'

const ai = useAiStore()
const creator = useCreatorStore()
const { openInCreator, loadTemplate, refineCreatorPatchWithAi } = useStudioActions()

const SOURCES = [
  { value: 'describe', label: 'Describe', icon: 'i-ph-magic-wand-bold' },
  { value: 'refine', label: 'Refine', icon: 'i-ph-pencil-simple-bold' },
  { value: 'template', label: 'Templates', icon: 'i-ph-layout-bold' },
]

const PROMPT_COPY: Record<'describe' | 'refine', { placeholder: string, action: string }> = {
  describe: {
    placeholder: '8-bit laser zap, crystal bell chime, sub bass drop...',
    action: 'Design',
  },
  refine: {
    placeholder: 'Make it punchier with a pitch dive, an octave lower...',
    action: 'Apply',
  },
}

const source = ref<Source>('describe')
const prompt = ref('')
const promptInput = ref<HTMLInputElement | null>(null)

const isTemplateMode = computed(() => source.value === 'template')
const copy = computed(() => PROMPT_COPY[source.value === 'refine' ? 'refine' : 'describe'])

const hint = computed(() => {
  if (source.value === 'template') {
    return `${ARCHETYPES.length} starting points. Loading one replaces the current patch.`
  }
  return source.value === 'refine'
    ? `Describe a change to apply to "${creator.state.name}".`
    : 'Describe a sound and load it straight into these controls.'
})

function selectSource(next: string): void {
  source.value = next as Source
}

async function submit(instruction = prompt.value): Promise<void> {
  const text = instruction.trim()
  if (!text || ai.isGenerating) {
    return
  }

  ai.dismissError()

  try {
    if (source.value === 'refine') {
      await refineCreatorPatchWithAi(text)
    }
    else {
      const result = await ai.generate(text)
      openInCreator(result.name, result.definition)
    }
    prompt.value = ''
  }
  catch {
    // Retains prompt on failure for rewording
    promptInput.value?.focus()
  }
}
</script>

<template>
  <ModulePanel title="Start from" icon="i-ph-sparkle-bold">
    <template #actions>
      <RouterLink to="/ai" class="inline-flex module-meta items-center gap-1 rounded-md px-1.5 py-1 text-ink-muted no-underline transition-colors duration-fast -mx-1.5 -my-1 hover:bg-control-active hover:text-accent-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
        <span>AI studio</span>
        <span class="i-ph-arrow-right-bold shrink-0 text-xs leading-none" aria-hidden="true" />
      </RouterLink>
    </template>

    <div class="space-y-3">
      <div class="flex">
        <ToggleGroup
          :model-value="source"
          :options="SOURCES"
          aria-label="Where the patch comes from"
          size="sm"
          @update:model-value="selectSource"
        />
      </div>

      <p class="text-xs text-ink-subtle font-sans">
        {{ hint }}
      </p>

      <div v-if="isTemplateMode" class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Patch templates">
        <button
          v-for="archetype in ARCHETYPES"
          :key="archetype.id"
          type="button"
          class="chip"
          @click="loadTemplate(archetype.id)"
        >
          {{ archetype.label }}
        </button>
      </div>

      <template v-else>
        <form class="min-w-0 flex flex-col gap-2 sm:flex-row sm:items-center" @submit.prevent="submit()">
          <label for="creator-ai-prompt" class="sr-only">{{ hint }}</label>
          <input
            id="creator-ai-prompt"
            ref="promptInput"
            v-model="prompt"
            type="text"
            autocomplete="off"
            spellcheck="false"
            :placeholder="copy.placeholder"
            :disabled="ai.isGenerating"
            :aria-invalid="ai.lastError ? 'true' : undefined"
            aria-errormessage="creator-ai-error"
            class="input-base flex-1 bg-surface-muted font-sans"
            @input="ai.dismissError()"
          >
          <button type="submit" class="btn-primary shrink-0" :disabled="!prompt.trim() || ai.isGenerating">
            <span
              :class="ai.isGenerating ? 'i-ph-circle-notch-bold animate-spin' : 'i-ph-magic-wand-bold'"
              class="shrink-0 text-xs leading-none"
              aria-hidden="true"
            />
            <span>{{ ai.isGenerating ? 'Working...' : copy.action }}</span>
          </button>
        </form>

        <p v-if="ai.isGenerating && ai.statusText" class="text-xs text-ink-muted font-mono" role="status" aria-live="polite">
          {{ ai.statusText }}
        </p>

        <p
          v-if="ai.lastError && !ai.isGenerating"
          id="creator-ai-error"
          class="flex items-start gap-1.5 text-xs text-danger-ink font-sans"
          role="alert"
        >
          <span class="i-ph-warning-circle-bold mt-px shrink-0 text-sm leading-none" aria-hidden="true" />
          <span>{{ ai.lastError }} The patch is unchanged. Adjust the wording and try again.</span>
        </p>

        <div
          v-if="source === 'refine'"
          class="flex flex-wrap items-center gap-1.5"
          role="group"
          :aria-label="`One-click edits for ${creator.state.name}`"
        >
          <button
            v-for="transform in QUICK_TRANSFORMS"
            :key="transform.label"
            type="button"
            class="chip"
            :disabled="ai.isGenerating"
            @click="submit(transform.prompt)"
          >
            {{ transform.label }}
          </button>
        </div>
      </template>
    </div>
  </ModulePanel>
</template>
