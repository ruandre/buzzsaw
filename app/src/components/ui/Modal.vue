<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { watch } from 'vue'
import { usePlaybackStore } from '../../stores'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  size?: 'md' | 'lg' | 'xl'
}>(), {
  description: '',
  size: 'md',
})

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
}>()

const WIDTHS = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
} as const

const playback = usePlaybackStore()

// Plays dismissal sound on modal close regardless of trigger
watch(() => props.open, (open, wasOpen) => {
  if (wasOpen && !open) {
    playback.cue('dismiss')
  }
})
</script>

<template>
  <DialogRoot :open="open" @update:open="value => emit('update:open', value)">
    <DialogPortal>
      <DialogOverlay class="modal-scrim fixed inset-0 z-50 bg-scrim/60" />
      <DialogContent
        closedby="any"
        class="modal fixed inset-0 z-50 m-auto h-fit max-h-[90vh] w-[92vw] flex flex-col overflow-hidden border border-line rounded-xl bg-surface shadow-popover sm:w-full"
        :class="WIDTHS[size]"
      >
        <header class="flex flex-shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div class="min-w-0">
            <DialogTitle class="text-base text-ink font-bold font-sans">
              {{ title }}
            </DialogTitle>
            <DialogDescription v-if="description" class="mt-0.5 text-xs text-ink-muted font-mono">
              {{ description }}
            </DialogDescription>
          </div>
          <DialogClose as-child>
            <button type="button" class="btn-icon" aria-label="Close dialog">
              <span class="i-ph-x-bold text-sm" aria-hidden="true" />
            </button>
          </DialogClose>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="flex flex-shrink-0 items-center justify-end gap-2 border-t border-line bg-surface-sunken px-6 py-3.5">
          <slot name="footer" />
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.modal-scrim[data-state='open'] {
  animation: scrim-in var(--duration-base) var(--ease-out);
}

.modal[data-state='open'] {
  animation: modal-in var(--duration-base) var(--ease-out);
}

.modal-scrim[data-state='closed'],
.modal[data-state='closed'] {
  animation-direction: reverse;
  animation-duration: var(--duration-fast);
  animation-fill-mode: forwards;
}

@keyframes scrim-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.97);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .modal-scrim,
  .modal {
    animation: none !important;
  }
}
</style>
