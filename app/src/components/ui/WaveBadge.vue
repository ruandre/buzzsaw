<script setup lang="ts">
import { computed } from 'vue'
import { getWaveIcon } from '../../theme/waveform'

const props = defineProps<{
  waveType?: OscillatorType
}>()

const label = computed(() => props.waveType ?? 'sine')
</script>

<template>
  <span class="badge-wave gap-1">
    <span :class="getWaveIcon(waveType)" class="text-xs" aria-hidden="true" />
    <span>{{ label }}</span>
  </span>
</template>
