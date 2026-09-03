<script setup lang="ts">
import {
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'

withDefaults(defineProps<{
  content: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  delayDuration?: number
  /** Keyboard shortcut rendered alongside label */
  shortcut?: string
}>(), {
  side: 'top',
  sideOffset: 6,
  delayDuration: 200,
  shortcut: '',
})
</script>

<template>
  <TooltipRoot :delay-duration="delayDuration">
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent
        :side="side"
        :side-offset="sideOffset"
        class="tooltip z-50 flex select-none items-center gap-2 border border-line-strong rounded-md bg-inverse px-2.5 py-1 text-xs text-inverse-ink leading-none font-mono shadow-popover"
      >
        <span>{{ content }}</span>
        <kbd v-if="shortcut" class="rounded bg-inverse-ink/20 px-1.5 py-0.5 text-xs font-bold font-mono">
          {{ shortcut }}
        </kbd>
        <TooltipArrow class="fill-inverse" />
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>

<style scoped>
.tooltip {
  transform-origin: var(--reka-tooltip-content-transform-origin, center);
  will-change: transform, opacity;
}

.tooltip[data-state='delayed-open'],
.tooltip[data-state='instant-open'] {
  animation: tooltip-in 130ms var(--ease-out);
}

@keyframes tooltip-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tooltip {
    animation: none !important;
  }
}
</style>
