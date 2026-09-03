import type { SoundDefinition, SoundStep } from '@rjvr/buzzsaw'
import type { Archetype } from '../audio/archetypes'
import { clamp, isEnvelope, round } from '@rjvr/buzzsaw'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { findArchetype } from '../audio/archetypes'
import { MAX_PITCH_HZ, MIN_PITCH_HZ, RANDOMISER_PITCHES } from '../audio/pitches'
import { useNotificationsStore } from './notifications'

export type ParameterMode = 'fixed' | 'steps'

// Retains both fixed and envelope values across mode toggles
export interface CreatorState {
  name: string
  waveType: OscillatorType
  /** Harmonics from AI patches; editor does not expose partials directly */
  partials?: number[]
  frequencyMode: ParameterMode
  fixedFrequency: number
  frequencyStart: number
  frequencySteps: SoundStep[]
  gainMode: ParameterMode
  fixedGain: number
  gainStart: number
  gainSteps: SoundStep[]
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
  return state.partials?.some(level => level > 0)
    ? { waveType: 'custom', partials: state.partials }
    : { waveType: 'sine' }
}

const MIN_GAIN = 0.001
const STEP_SPACING_S = 0.05

export const useCreatorStore = defineStore('creator', () => {
  const notifications = useNotificationsStore()
  const state = ref<CreatorState>(structuredClone(DEFAULT_CREATOR_STATE))

  /** Compiles editable state into valid SoundDefinition */
  const definition = computed<SoundDefinition>(() => {
    const s = state.value
    const duration = Math.max(CREATOR_LIMITS.duration.min, s.duration || DEFAULT_CREATOR_STATE.duration)
    const attack = clamp(s.attack || 0, 0, duration)
    const decay = clamp(s.decay || 0, 0, Math.max(MIN_GAIN, duration - attack))

    return {
      ...resolveTimbre(s),
      duration,
      attack,
      decay,
      frequency: s.frequencyMode === 'fixed'
        ? clampPitch(s.fixedFrequency)
        : { start: clampPitch(s.frequencyStart), steps: s.frequencySteps.map(clampFrequencyStep) },
      gain: s.gainMode === 'fixed'
        ? Math.max(MIN_GAIN, s.fixedGain)
        : { start: Math.max(MIN_GAIN, s.gainStart), steps: s.gainSteps.map(clampGainStep) },
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

    state.value = {
      name,
      waveType: source.waveType ?? 'sine',
      partials: source.partials ? [...source.partials] : undefined,
      frequencyMode: isEnvelope(frequency) ? 'steps' : 'fixed',
      fixedFrequency: baseFrequency,
      frequencyStart: baseFrequency,
      frequencySteps: isEnvelope(frequency)
        ? frequency.steps.map(step => ({ ...step }))
        : [{ value: Math.round(baseFrequency * 1.5), time: 0.1 }],
      gainMode: isEnvelope(gain) ? 'steps' : 'fixed',
      fixedGain: baseGain,
      gainStart: baseGain,
      gainSteps: isEnvelope(gain)
        ? gain.steps.map(step => ({ ...step }))
        : [{ value: MIN_GAIN, time: 0.2 }],
      duration: source.duration ?? DEFAULT_CREATOR_STATE.duration,
      attack: source.attack ?? DEFAULT_CREATOR_STATE.attack,
      decay: source.decay ?? DEFAULT_CREATOR_STATE.decay,
    }
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
    state.value = structuredClone(DEFAULT_CREATOR_STATE)
    notifications.announce('Reset the synthesizer to defaults', 'info', 'polite')
  }

  /** Generates random musically coherent patch */
  function randomize(): void {
    const waveType = pickRandom<OscillatorType>(['sine', 'square', 'sawtooth', 'triangle'])
    const duration = round(0.05 + Math.random() * 0.55, 2)
    const useContour = Math.random() > 0.35
    const startPitch = pickRandom(RANDOMISER_PITCHES)
    const endPitch = pickRandom(RANDOMISER_PITCHES)

    state.value = {
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
    }
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

  function nextStepTime(previousTime?: number): number {
    return round(Math.min(state.value.duration, (previousTime ?? 0) + STEP_SPACING_S), 3)
  }

  return {
    state,
    definition,
    load,
    loadArchetype,
    reset,
    randomize,
    addFrequencyStep,
    removeFrequencyStep,
    sortFrequencySteps,
    addGainStep,
    removeGainStep,
    sortGainSteps,
    setPitch,
    shiftOctave,
  }
})

function clampPitch(hz: number): number {
  return clamp(hz || DEFAULT_CREATOR_STATE.fixedFrequency, MIN_PITCH_HZ, MAX_PITCH_HZ)
}

function clampFrequencyStep(step: SoundStep): SoundStep {
  return { value: clampPitch(step.value), time: Math.max(0, step.time || 0) }
}

function clampGainStep(step: SoundStep): SoundStep {
  return { value: Math.max(0, step.value || 0), time: Math.max(0, step.time || 0) }
}

function byTime(a: SoundStep, b: SoundStep): number {
  return a.time - b.time
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}
