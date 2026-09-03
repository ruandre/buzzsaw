import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NoticeTone = 'info' | 'success' | 'warning' | 'error'

/** ARIA live announcement urgency: polite queues; assertive interrupts */
export type NoticeUrgency = 'polite' | 'assertive'

export interface Notice {
  id: string
  message: string
  tone: NoticeTone
  urgency: NoticeUrgency
  /** Milliseconds before auto-dismiss; 0 persists until dismissed */
  durationMs: number
}

const DEFAULT_DURATION_MS = 4000
const BRIEF_DURATION_MS = 1800
const MAX_VISIBLE = 4

export const useNotificationsStore = defineStore('notifications', () => {
  const notices = ref<Notice[]>([])
  let sequence = 0

  function announce(
    message: string,
    tone: NoticeTone = 'info',
    urgency: NoticeUrgency = 'polite',
    durationMs: number = DEFAULT_DURATION_MS,
  ): string {
    const id = `notice-${++sequence}`
    notices.value = [...notices.value, { id, message, tone, urgency, durationMs }].slice(-MAX_VISIBLE)

    if (durationMs > 0) {
      setTimeout(dismiss, durationMs, id)
    }
    return id
  }

  /** Short-lived success confirmation */
  function confirm(message: string): string {
    return announce(message, 'success', 'polite', BRIEF_DURATION_MS)
  }

  /** Urgent assertive error notice */
  function reportError(message: string): string {
    return announce(message, 'error', 'assertive')
  }

  function dismiss(id: string): void {
    notices.value = notices.value.filter(notice => notice.id !== id)
  }

  function dismissAll(): void {
    notices.value = []
  }

  return { notices, announce, confirm, reportError, dismiss, dismissAll }
})

/** Announce notification function signature */
export type Announce = ReturnType<typeof useNotificationsStore>['announce']
