<script setup lang="ts">
import { KEYBOARD_PITCHES, MAX_PITCH_HZ, MIN_PITCH_HZ, MUSICAL_PITCHES } from '../../audio/pitches'
import { CREATOR_LIMITS, useCreatorStore } from '../../stores'
import ModulePanel from '../ui/ModulePanel.vue'
import Slider from '../ui/Slider.vue'
import EnvelopeStepEditor from './EnvelopeStepEditor.vue'
import ParameterModeSwitch from './ParameterModeSwitch.vue'

const creator = useCreatorStore()

// Usable slider drag range for base pitch
const PITCH_SLIDER = { min: 50, max: 3000, step: 5 } as const
</script>

<template>
  <ModulePanel title="Pitch" icon="i-ph-music-note-bold" meta="03">
    <div class="space-y-5">
      <ParameterModeSwitch
        v-model="creator.state.frequencyMode"
        label="Pitch"
        steps-label="Modulated"
      />

      <div class="space-y-2">
        <div class="flex items-center justify-between gap-3">
          <span class="select-none text-xs text-ink-muted font-semibold tracking-wider font-mono uppercase">Note</span>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="btn-secondary px-2 py-0.5 text-xs font-mono"
              aria-label="Shift down one octave"
              @click="creator.shiftOctave(-1)"
            >
              −Oct
            </button>
            <button
              type="button"
              class="btn-secondary px-2 py-0.5 text-xs font-mono"
              aria-label="Shift up one octave"
              @click="creator.shiftOctave(1)"
            >
              +Oct
            </button>
          </div>
        </div>

        <div class="grid grid-cols-5 gap-1.5 sm:grid-cols-10" role="group" aria-label="Pitch presets">
          <button
            v-for="note in KEYBOARD_PITCHES"
            :key="note"
            type="button"
            class="btn-secondary justify-center px-1 py-1 text-center text-xs font-bold font-mono transition-all duration-fast"
            :class="creator.state.frequencyMode === 'fixed' && Math.round(creator.state.fixedFrequency) === Math.round(MUSICAL_PITCHES[note])
              ? 'bg-control border-accent text-accent-ink shadow-raised ring-1 ring-accent'
              : 'text-ink'"
            :aria-label="`Set pitch to ${note}, ${MUSICAL_PITCHES[note]} hertz`"
            @click="creator.setPitch(MUSICAL_PITCHES[note])"
          >
            {{ note }}
          </button>
        </div>
      </div>

      <Slider
        v-if="creator.state.frequencyMode === 'fixed'"
        v-model="creator.state.fixedFrequency"
        :min="PITCH_SLIDER.min"
        :max="PITCH_SLIDER.max"
        :step="PITCH_SLIDER.step"
        label="Base pitch"
        :format-value="value => `${Math.round(value)} Hz`"
      />

      <div v-else class="space-y-3">
        <div class="flex items-center gap-2.5">
          <label for="pitch-start" class="w-24 select-none text-sm text-ink-muted font-semibold font-mono">Start</label>
          <input
            id="pitch-start"
            v-model.number="creator.state.frequencyStart"
            type="number"
            inputmode="numeric"
            :min="MIN_PITCH_HZ"
            :max="MAX_PITCH_HZ"
            :step="CREATOR_LIMITS.frequency.step"
            class="w-28 border border-line-control rounded-md bg-surface-muted px-2.5 py-1 text-sm text-ink font-bold font-mono shadow-inset transition-colors duration-fast focus:border-accent focus:outline-none"
          >
          <span class="select-none text-xs text-ink-subtle font-semibold font-mono">Hz at t = 0s</span>
        </div>

        <EnvelopeStepEditor
          :steps="creator.state.frequencySteps"
          id-prefix="pitch-step"
          value-label="Frequency"
          value-unit="Hz"
          :value-min="MIN_PITCH_HZ"
          :value-max="MAX_PITCH_HZ"
          :value-step="CREATOR_LIMITS.frequency.step"
          :time-max="creator.state.duration"
          add-label="Add pitch point"
          @add="creator.addFrequencyStep()"
          @remove="creator.removeFrequencyStep($event)"
          @sort="creator.sortFrequencySteps()"
        />
      </div>
    </div>
  </ModulePanel>
</template>
