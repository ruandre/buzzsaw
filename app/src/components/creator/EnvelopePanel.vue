<script setup lang="ts">
import { CREATOR_LIMITS, useCreatorStore } from '../../stores'
import ModulePanel from '../ui/ModulePanel.vue'
import Slider from '../ui/Slider.vue'
import EnvelopeStepEditor from './EnvelopeStepEditor.vue'
import ParameterModeSwitch from './ParameterModeSwitch.vue'

const creator = useCreatorStore()

const asMilliseconds = (seconds: number) => `${Math.round(seconds * 1000)} ms`
const asPercent = (gain: number) => `${Math.round(gain * 100)}%`
</script>

<template>
  <ModulePanel title="Envelope" icon="i-ph-chart-line-up-bold" meta="02">
    <div class="space-y-5">
      <Slider
        v-model="creator.state.attack"
        :min="0.001"
        :max="CREATOR_LIMITS.attack.max"
        :step="0.002"
        label="Attack"
        :format-value="value => `${(value * 1000).toFixed(1)} ms`"
      />

      <Slider
        v-model="creator.state.decay"
        :min="0.001"
        :max="CREATOR_LIMITS.decay.max"
        :step="CREATOR_LIMITS.decay.step"
        label="Decay"
        :format-value="asMilliseconds"
      />

      <div class="border-t border-line-subtle pt-3 space-y-3">
        <ParameterModeSwitch
          v-model="creator.state.gainMode"
          label="Gain"
          steps-label="Multi-point"
        />

        <Slider
          v-if="creator.state.gainMode === 'fixed'"
          v-model="creator.state.fixedGain"
          :min="0.01"
          :max="CREATOR_LIMITS.gain.max"
          :step="CREATOR_LIMITS.gain.step"
          label="Peak level"
          :format-value="asPercent"
        />

        <div v-else class="space-y-2.5">
          <div class="flex items-center gap-2.5">
            <label for="gain-start" class="w-24 select-none text-sm text-ink-muted font-semibold font-mono">Start</label>
            <input
              id="gain-start"
              v-model.number="creator.state.gainStart"
              type="number"
              inputmode="decimal"
              min="0"
              :max="CREATOR_LIMITS.gain.max"
              step="0.05"
              class="w-24 border border-line-control rounded-md bg-surface-muted px-2.5 py-1 text-sm text-ink font-bold font-mono shadow-inset transition-colors duration-fast focus:border-accent focus:outline-none"
            >
            <span class="select-none text-xs text-ink-subtle font-semibold font-mono">at t = 0s</span>
          </div>

          <EnvelopeStepEditor
            :steps="creator.state.gainSteps"
            id-prefix="gain-step"
            value-label="Gain level"
            :value-min="0"
            :value-max="CREATOR_LIMITS.gain.max"
            :value-step="0.05"
            :time-max="creator.state.duration"
            add-label="Add gain point"
            @add="creator.addGainStep()"
            @remove="creator.removeGainStep($event)"
            @sort="creator.sortGainSteps()"
          />
        </div>
      </div>
    </div>
  </ModulePanel>
</template>
