<script setup lang="ts">
import type { NoticeTone } from '../stores'
import { computed } from 'vue'
import { useNotificationsStore } from '../stores'

const notifications = useNotificationsStore()

/** Icon and style accents per notification tone */
const TONE_STYLES: Record<NoticeTone, { icon: string, accent: string }> = {
  info: { icon: 'i-ph-info-bold', accent: 'text-accent border-accent/30' },
  success: { icon: 'i-ph-check-circle-bold', accent: 'text-success border-success/30' },
  warning: { icon: 'i-ph-warning-bold', accent: 'text-warning border-warning/30' },
  error: { icon: 'i-ph-warning-octagon-bold', accent: 'text-danger-ink border-danger/40' },
}

const politeMessages = computed(() =>
  notifications.notices.filter(notice => notice.urgency === 'polite').map(notice => notice.message))
const assertiveMessages = computed(() =>
  notifications.notices.filter(notice => notice.urgency === 'assertive').map(notice => notice.message))
</script>

<template>
  <div class="sr-only" aria-live="polite" aria-atomic="false">
    <p v-for="(message, index) in politeMessages" :key="index">
      {{ message }}
    </p>
  </div>
  <div class="sr-only" aria-live="assertive" aria-atomic="false">
    <p v-for="(message, index) in assertiveMessages" :key="index">
      {{ message }}
    </p>
  </div>

  <aside
    class="pointer-events-none fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] flex flex-col gap-2.5"
    aria-label="Notifications"
  >
    <TransitionGroup name="notice">
      <div
        v-for="notice in notifications.notices"
        :key="notice.id"
        class="pointer-events-auto flex items-center justify-between gap-3 border rounded-xl bg-surface p-3.5 shadow-popover"
        :class="TONE_STYLES[notice.tone].accent"
      >
        <div class="min-w-0 flex items-center gap-2.5">
          <span :class="TONE_STYLES[notice.tone].icon" class="flex-shrink-0 text-base" aria-hidden="true" />
          <span class="text-sm text-ink font-semibold leading-tight font-sans">{{ notice.message }}</span>
        </div>

        <button
          type="button"
          class="flex-shrink-0 cursor-pointer border-0 bg-transparent p-1 text-ink-subtle transition-colors duration-fast active:scale-90 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          aria-label="Dismiss notification"
          @click="notifications.dismiss(notice.id)"
        >
          <span class="i-ph-x-bold text-xs" aria-hidden="true" />
        </button>
      </div>
    </TransitionGroup>
  </aside>
</template>

<style scoped>
.notice-enter-active,
.notice-leave-active {
  transition:
    transform var(--duration-base) var(--ease-out),
    opacity var(--duration-base) var(--ease-out);
}

.notice-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.notice-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

/* Absolute positioning prevents layout jump while remaining items animate. */
.notice-leave-active {
  position: absolute;
  inset-inline: 0;
}

.notice-move {
  transition: transform var(--duration-base) var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  .notice-enter-active,
  .notice-leave-active,
  .notice-move {
    transition: opacity 100ms ease !important;
  }

  .notice-enter-from,
  .notice-leave-to {
    transform: none !important;
  }
}
</style>
