import type { WatchSource } from 'vue'
import { highlightAll } from 'microlighter'
import { onMounted, watch } from 'vue'

function isSupported(): boolean {
  return typeof CSS !== 'undefined' && 'highlights' in CSS
}

let scheduledFrame: number | null = null

/** Queues next-frame highlight pass. highlightAll() resets all registered ranges */
export function scheduleSyntaxHighlight(): void {
  if (!isSupported() || scheduledFrame !== null) {
    return
  }
  scheduledFrame = requestAnimationFrame(() => {
    scheduledFrame = null
    void highlightAll()
  })
}

/** Re-highlights on mount and source changes */
export function useSyntaxHighlight(source: WatchSource<unknown>): void {
  onMounted(scheduleSyntaxHighlight)
  watch(source, scheduleSyntaxHighlight, { flush: 'post' })
}
