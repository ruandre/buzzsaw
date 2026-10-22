<script setup lang="ts">
import { useNow } from '@vueuse/core'
import { computed } from 'vue'

// Quick steps end before a counter helps; showing one would only flicker
const VISIBLE_AFTER_SECONDS = 2

const startedAt = Date.now()
const now = useNow({ interval: 1000 })
const seconds = computed(() => Math.floor((now.value.getTime() - startedAt) / 1000))
</script>

<template>
  <!-- Hidden from assistive tech: a ticking count inside a live region would be announced every second -->
  <time
    v-if="seconds >= VISIBLE_AFTER_SECONDS"
    :datetime="`PT${seconds}S`"
    class="shrink-0 tabular-nums"
    aria-hidden="true"
  >{{ seconds }}s</time>
</template>
