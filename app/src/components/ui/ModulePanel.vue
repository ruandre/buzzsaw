<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{
  title: string
  icon: string
  /** Right-aligned header metadata stamp */
  meta?: string
  /** Style tone: card (standard) or bay (recessed display) */
  tone?: 'card' | 'bay'
  /** Applies default padding to body */
  padded?: boolean
}>(), {
  meta: '',
  tone: 'card',
  padded: true,
})

const titleId = useId()
</script>

<template>
  <section
    class="min-w-0 w-full flex flex-col overflow-hidden"
    :class="tone === 'bay' ? 'bezel-bay p-0' : 'surface-card'"
    :aria-labelledby="titleId"
  >
    <header class="module-header">
      <div class="min-w-0 flex items-center gap-2">
        <span :class="icon" class="shrink-0 text-sm text-accent leading-none" aria-hidden="true" />
        <h2 :id="titleId" class="module-title truncate">
          {{ title }}
        </h2>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <slot name="actions">
          <span v-if="meta" class="module-meta">{{ meta }}</span>
        </slot>
      </div>
    </header>

    <div :class="padded ? 'module-body' : ''">
      <slot />
    </div>
  </section>
</template>
