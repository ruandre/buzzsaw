<script setup lang="ts">
import { usePlaybackStore, useUiStore } from '../stores'

const ui = useUiStore()
const playback = usePlaybackStore()

function scrollToTop(): void {
  playback.cue('scrollTop')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer role="contentinfo" class="mt-16 border-t border-line bg-chrome py-5 text-ink-muted">
    <div class="layout-container flex flex-col items-center gap-3 text-center font-mono sm:flex-row sm:justify-between sm:gap-4">
      <button
        type="button"
        class="hidden cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs text-ink-muted leading-none font-mono transition-colors duration-fast sm:inline-flex hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        @click="ui.setShortcutsSheetOpen(true)"
      >
        <span>Press</span>
        <kbd class="h-4.5 min-w-[1.25rem] inline-flex items-center justify-center border border-line-control rounded-[3px] bg-surface-sunken px-1 text-[11px] text-ink font-bold font-mono shadow-inset">?</kbd>
        <span>for shortcuts</span>
      </button>

      <p class="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-ink-subtle sm:flex-1">
        <span class="whitespace-nowrap">Zero dependencies</span>
        <span aria-hidden="true">·</span>
        <span class="whitespace-nowrap">Web Audio API</span>
        <span aria-hidden="true">·</span>
        <span class="whitespace-nowrap">Runs entirely on-device</span>
      </p>

      <button type="button" class="btn-secondary px-2.5 py-1.5 text-xs" aria-label="Scroll to top" @click="scrollToTop">
        <span class="i-ph-arrow-up-bold text-xs" aria-hidden="true" />
        <span class="hidden sm:inline">Top</span>
      </button>
    </div>
  </footer>
</template>
