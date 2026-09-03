<script setup lang="ts">
import { CREATOR_LIMITS, useCreatorStore } from '../../stores'
import ModulePanel from '../ui/ModulePanel.vue'
import Slider from '../ui/Slider.vue'
import ToggleGroup from '../ui/ToggleGroup.vue'

const creator = useCreatorStore()

const WAVEFORMS = [
  { value: 'sine', label: 'Sine', icon: 'i-ph-wave-sine-bold' },
  { value: 'square', label: 'Square', icon: 'i-ph-wave-square-bold' },
  { value: 'sawtooth', label: 'Saw', icon: 'i-ph-wave-sawtooth-bold' },
  { value: 'triangle', label: 'Tri', icon: 'i-ph-wave-triangle-bold' },
]

const asMilliseconds = (seconds: number) => `${Math.round(seconds * 1000)} ms`
</script>

<template>
  <ModulePanel title="Oscillator" icon="i-ph-wave-sine-bold" meta="01">
    <div class="space-y-5">
      <div class="space-y-2">
        <span class="block select-none text-xs text-ink-muted font-semibold tracking-wider font-mono uppercase">Waveform</span>
        <ToggleGroup
          v-model="creator.state.waveType"
          :options="WAVEFORMS"
          aria-label="Oscillator waveform"
        />
      </div>

      <Slider
        v-model="creator.state.duration"
        :min="0.02"
        :max="CREATOR_LIMITS.duration.max"
        :step="CREATOR_LIMITS.duration.step"
        label="Duration"
        :format-value="asMilliseconds"
      />
    </div>
  </ModulePanel>
</template>
