<script setup lang="ts">
import { computed } from 'vue'
import { parseProse } from '../../docs/markup'

/** Renders prose string with backticked spans converted to <code> elements */
const props = defineProps<{
  text: string
}>()

const segments = computed(() => parseProse(props.text))
</script>

<template>
  <template v-for="(segment, index) in segments" :key="index">
    <code v-if="segment.isCode" class="inline-code">{{ segment.text }}</code>
    <template v-else>
      {{ segment.text }}
    </template>
  </template>
</template>
