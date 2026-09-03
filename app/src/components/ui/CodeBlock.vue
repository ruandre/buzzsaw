<script setup lang="ts">
import { useStudioActions, useSyntaxHighlight, useTransientFlag } from '../../composables'
import { usePlaybackStore } from '../../stores'

const props = withDefaults(defineProps<{
  code: string
  language?: string
}>(), {
  language: 'typescript',
})

useSyntaxHighlight(() => props.code)

const COPIED_FEEDBACK_MS = 1800

const playback = usePlaybackStore()
const { copyToClipboard } = useStudioActions()
const { isRaised: justCopied, raise: acknowledgeCopy } = useTransientFlag(COPIED_FEEDBACK_MS)

async function copy(): Promise<void> {
  playback.cue('copy')
  if (await copyToClipboard(props.code, `${props.language} snippet`)) {
    acknowledgeCopy()
  }
}
</script>

<template>
  <div class="code-block">
    <div class="mb-3 flex items-center justify-between border-b border-line pb-2">
      <span class="text-xs text-ink-subtle font-mono">{{ language }}</span>
      <button type="button" class="btn-secondary px-2.5 py-1 text-xs" :aria-label="`Copy ${language} snippet`" @click="copy">
        <span :class="justCopied ? 'i-ph-check-bold text-success' : 'i-ph-copy-bold'" class="text-xs" aria-hidden="true" />
        <span>{{ justCopied ? 'Copied' : 'Copy' }}</span>
      </button>
    </div>
    <pre tabindex="0" class="overflow-x-auto whitespace-pre text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"><code :class="`language-${language}`">{{ code }}</code></pre>
  </div>
</template>
