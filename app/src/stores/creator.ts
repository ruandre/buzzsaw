import type { EnvelopeDefinition, EnvelopeInterpolation, SoundDefinition, SoundStep, WaveType } from '@rjvr/buzzsaw'
import type { Archetype } from '../audio/archetypes'
import {
  clamp,
  DEFAULT_ATTACK_S,
  DEFAULT_DECAY_S,
  DEFAULT_DURATION_S,
  isEnvelope,
  MAX_FREQUENCY_HZ,
  round,
} from '@rjvr/buzzsaw'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'
import { findArchetype } from '../audio/archetypes'
import { MAX_PITCH_HZ, MIN_PITCH_HZ, RANDOMISER_PITCHES } from '../audio/pitches'
import { useNotificationsStore } from './notifications'

export type ParameterMode = 'fixed' | 'steps'

// Retains both fixed and envelope values across mode toggles
export interface CreatorState {
  name: string
  waveType: WaveType
  /** Harmonics from AI patches; editor does not expose partials directly */
  partials?: number[]
  frequencyMode: ParameterMode
  fixedFrequency: number
  frequencyStart: number
  frequencySteps: SoundStep[]
  frequencyInterpolation?: EnvelopeInterpolation
  gainMode: ParameterMode
  fixedGain: number
  gainStart: number
  gainSteps: SoundStep[]
  gainInterpolation?: EnvelopeInterpolation
  duration: number
  attack: number
  decay: number
}

export const DEFAULT_CREATOR_STATE: CreatorState = {
  name: 'mySound',
  waveType: 'sine',
  frequencyMode: 'fixed',
  fixedFrequency: 440,
  frequencyStart: 440,
  frequencySteps: [
    { value: 880, time: 0.1 },
    { value: 440, time: 0.2 },
  ],
  gainMode: 'fixed',
  fixedGain: 0.4,
  gainStart: 0.4,
  gainSteps: [
    { value: 0.5, time: 0.05 },
    { value: 0.001, time: 0.2 },
  ],
  duration: 0.3,
  attack: 0.01,
  decay: 0.1,
}

export const CREATOR_LIMITS = {
  duration: { min: 0.01, max: 2.5, step: 0.01 },
  attack: { min: 0, max: 0.5, step: 0.001 },
  decay: { min: 0, max: 1.5, step: 0.005 },
  gain: { min: 0, max: 1, step: 0.01 },
  frequency: { min: MIN_PITCH_HZ, max: MAX_PITCH_HZ, step: 1 },
} as const

// Custom wave requires harmonics; falls back to sine
function resolveTimbre(state: CreatorState): Pick<SoundDefinition, 'waveType' | 'partials'> {
  if (state.waveType !== 'custom') {
    return { waveType: state.waveType }
  }
  return state.partials?.some(level => level !== 0)
    ? { waveType: 'custom', partials: state.partials }
    : { waveType: 'sine' }
}

const MIN_GAIN = 0.001
const STEP_SPACING_S = 0.05
// Slider range above a loaded sound's timing, so it can grow as well as shrink
const LOADED_TIMING_HEADROOM = 1.25

export const useCreatorStore = defineStore('creator', () => {
  const notifications = useNotificationsStore()
  const state = ref<CreatorState>(structuredClone(DEFAULT_CREATOR_STATE))
  // Captured per load, not read live: a max tracking state.duration would shrink mid-drag
  const timingCeiling = shallowRef(timingCeilingFor(DEFAULT_CREATOR_STATE))

  const timing = computed(() => {
    const s = state.value
    const duration = Math.max(CREATOR_LIMITS.duration.min, s.duration || DEFAULT_CREATOR_STATE.duration)
    const attack = clamp(s.attack || 0, 0, duration)
    const decay = clamp(s.decay || 0, 0, duration - attack)
    return { duration, attack, decay }
  })

  const durationMax = computed(() => timingCeiling.value.duration)
  const attackMax = computed(() => Math.min(timingCeiling.value.attack, timing.value.duration))
  const decayMax = computed(() => Math.min(timingCeiling.value.decay, timing.value.duration - timing.value.attack))

  // Sliders read state; keeping it at compiled timing makes readouts match playback
  watch(timing, ({ attack, decay }) => {
    state.value.attack = attack
    state.value.decay = decay
  })

  /** Compiles editable state into valid SoundDefinition */
  const definition = computed<SoundDefinition>(() => {
    const s = state.value
    // Core extends a sound to its last step, so a typo such as 100 for 0.1 would play for 100 s
    const maxStepTime = Math.max(CREATOR_LIMITS.duration.max, timing.value.duration)
    const clampSteps = (steps: SoundStep[], clampValue: (value: number) => number) =>
      steps.map(step => ({ value: clampValue(step.value), time: clamp(step.time || 0, 0, maxStepTime) }))

    return {
      ...resolveTimbre(s),
      ...timing.value,
      frequency: s.frequencyMode === 'fixed'
        ? clampFrequency(s.fixedFrequency)
        : toEnvelope(clampFrequency(s.frequencyStart), clampSteps(s.frequencySteps, clampFrequency), s.frequencyInterpolation),
      gain: s.gainMode === 'fixed'
        ? clampGain(s.fixedGain, MIN_GAIN)
        : toEnvelope(clampGain(s.gainStart, MIN_GAIN), clampSteps(s.gainSteps, value => clampGain(value, 0)), s.gainInterpolation),
    }
  })

  /** Loads definition into editor, preserving parameter modes */
  function load(name: string, source: SoundDefinition): void {
    const frequency = source.frequency
    const gain = source.gain
    const baseFrequency = typeof frequency === 'number'
      ? frequency
      : isEnvelope(frequency) ? frequency.start : DEFAULT_CREATOR_STATE.fixedFrequency
    const baseGain = typeof gain === 'number'
      ? gain
      : isEnvelope(gain) ? gain.start : DEFAULT_CREATOR_STATE.fixedGain

    replaceState({
      name,
      waveType: source.waveType ?? 'sine',
      partials: source.partials ? [...source.partials] : undefined,
      frequencyMode: isEnvelope(frequency) ? 'steps' : 'fixed',
      fixedFrequency: baseFrequency,
      frequencyStart: baseFrequency,
      frequencySteps: isEnvelope(frequency)
        ? frequency.steps.map(step => ({ ...step }))
        : [{ value: Math.round(baseFrequency * 1.5), time: 0.1 }],
      frequencyInterpolation: isEnvelope(frequency) ? frequency.interpolation : undefined,
      gainMode: isEnvelope(gain) ? 'steps' : 'fixed',
      fixedGain: baseGain,
      gainStart: baseGain,
      gainSteps: isEnvelope(gain)
        ? gain.steps.map(step => ({ ...step }))
        : [{ value: MIN_GAIN, time: 0.2 }],
      gainInterpolation: isEnvelope(gain) ? gain.interpolation : undefined,
      duration: source.duration ?? DEFAULT_DURATION_S,
      attack: source.attack ?? DEFAULT_ATTACK_S,
      decay: source.decay ?? DEFAULT_DECAY_S,
    })
    notifications.announce(`Loaded "${name}" into the synthesizer`, 'info', 'polite')
  }

  function loadArchetype(id: string): void {
    const archetype = findArchetype(id)
    if (!archetype) {
      return
    }
    loadTemplate(archetype)
  }

  function loadTemplate(archetype: Archetype): void {
    load(archetype.name, archetype.definition)
    notifications.announce(`Loaded the ${archetype.label} template`, 'info', 'polite', 2000)
  }

  function reset(): void {
    replaceState(structuredClone(DEFAULT_CREATOR_STATE))
    notifications.announce('Reset the synthesizer to defaults', 'info', 'polite')
  }

  /** Generates random musically coherent patch */
  function randomize(): void {
    const waveType = pickRandom<WaveType>(['sine', 'square', 'sawtooth', 'triangle'])
    const duration = round(0.05 + Math.random() * 0.55, 2)
    const useContour = Math.random() > 0.35
    const startPitch = pickRandom(RANDOMISER_PITCHES)
    const endPitch = pickRandom(RANDOMISER_PITCHES)

    replaceState({
      name: `synth_${waveType}_${Math.floor(Math.random() * 1000)}`,
      waveType,
      frequencyMode: useContour ? 'steps' : 'fixed',
      fixedFrequency: startPitch,
      frequencyStart: startPitch,
      frequencySteps: useContour ? [{ value: endPitch, time: round(duration * 0.7, 2) }] : [],
      gainMode: 'fixed',
      fixedGain: round(0.2 + Math.random() * 0.35, 2),
      gainStart: 0.35,
      gainSteps: [{ value: MIN_GAIN, time: duration }],
      duration,
      attack: round(0.002 + Math.random() * 0.03, 3),
      decay: round(duration * 0.45, 3),
    })
    notifications.announce(`Generated a random ${waveType} patch`, 'info', 'polite')
  }

  function addFrequencyStep(): void {
    const steps = state.value.frequencySteps
    const previous = steps[steps.length - 1]
    steps.push({
      value: clampPitch(Math.round((previous?.value ?? state.value.frequencyStart) * 1.25)),
      time: nextStepTime(previous?.time),
    })
    sortFrequencySteps()
  }

  function removeFrequencyStep(index: number): void {
    state.value.frequencySteps.splice(index, 1)
  }

  function sortFrequencySteps(): void {
    state.value.frequencySteps.sort(byTime)
  }

  function updateFrequencyStep(index: number, patch: Partial<SoundStep>): void {
    updateStep(state.value.frequencySteps, index, patch)
  }

  function addGainStep(): void {
    const steps = state.value.gainSteps
    steps.push({ value: 0.1, time: nextStepTime(steps[steps.length - 1]?.time) })
    sortGainSteps()
  }

  function removeGainStep(index: number): void {
    state.value.gainSteps.splice(index, 1)
  }

  function sortGainSteps(): void {
    state.value.gainSteps.sort(byTime)
  }

  function updateGainStep(index: number, patch: Partial<SoundStep>): void {
    updateStep(state.value.gainSteps, index, patch)
  }

  /** Sets base pitch for both fixed and envelope frequency modes */
  function setPitch(hz: number): void {
    const pitch = Math.round(clampPitch(hz))
    if (state.value.frequencyMode === 'fixed') {
      state.value.fixedFrequency = pitch
    }
    else {
      state.value.frequencyStart = pitch
    }
    notifications.announce(`Pitch set to ${pitch} Hz`, 'info', 'polite', 1500)
  }

  /** Transposes base pitch and contour steps by one octave */
  function shiftOctave(direction: 1 | -1): void {
    const factor = direction === 1 ? 2 : 0.5
    const shifted = (value: number) => Math.round(clampPitch(value * factor))

    if (state.value.frequencyMode === 'fixed') {
      state.value.fixedFrequency = shifted(state.value.fixedFrequency)
    }
    else {
      state.value.frequencyStart = shifted(state.value.frequencyStart)
      for (const step of state.value.frequencySteps) {
        step.value = shifted(step.value)
      }
    }
    notifications.announce(`Shifted ${direction === 1 ? 'up' : 'down'} one octave`, 'info', 'polite', 1200)
  }

  function replaceState(next: CreatorState): void {
    state.value = next
    timingCeiling.value = timingCeilingFor(next)
  }

  function nextStepTime(previousTime?: number): number {
    return round(Math.min(state.value.duration, (previousTime ?? 0) + STEP_SPACING_S), 3)
  }

  return {
    state,
    definition,
    durationMax,
    attackMax,
    decayMax,
    load,
    loadArchetype,
    reset,
    randomize,
    addFrequencyStep,
    removeFrequencyStep,
    sortFrequencySteps,
    updateFrequencyStep,
    addGainStep,
    removeGainStep,
    sortGainSteps,
    updateGainStep,
    setPitch,
    shiftOctave,
  }
})

// Sliders clamp every move to max; a long loaded sound widens its range instead of being cut
function timingCeilingFor({ duration, attack, decay }: Pick<CreatorState, 'duration' | 'attack' | 'decay'>) {
  return {
    duration: Math.max(CREATOR_LIMITS.duration.max, duration * LOADED_TIMING_HEADROOM),
    attack: Math.max(CREATOR_LIMITS.attack.max, attack * LOADED_TIMING_HEADROOM),
    decay: Math.max(CREATOR_LIMITS.decay.max, decay * LOADED_TIMING_HEADROOM),
  }
}

function clampPitch(hz: number): number {
  return clamp(hz || DEFAULT_CREATOR_STATE.fixedFrequency, MIN_PITCH_HZ, MAX_PITCH_HZ)
}

// Compiled output spans core's range; UI controls keep pitch range
function clampFrequency(hz: number): number {
  return hz > 0 ? Math.min(hz, MAX_FREQUENCY_HZ) : DEFAULT_CREATOR_STATE.fixedFrequency
}

function toEnvelope(start: number, steps: SoundStep[], interpolation?: EnvelopeInterpolation): EnvelopeDefinition {
  return interpolation ? { start, steps, interpolation } : { start, steps }
}

// Number inputs accept typed values beyond their max attribute
function clampGain(value: number, min: number): number {
  return clamp(value || 0, min, CREATOR_LIMITS.gain.max)
}

// Mutates in place: step editor keys rows by step identity
function updateStep(steps: SoundStep[], index: number, patch: Partial<SoundStep>): void {
  const step = steps[index]
  if (step) {
    Object.assign(step, patch)
  }
}

function byTime(a: SoundStep, b: SoundStep): number {
  return a.time - b.time
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}
