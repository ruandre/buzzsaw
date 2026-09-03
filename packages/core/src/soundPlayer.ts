import type { PlaybackHandle, SoundDefinition, StandaloneSoundOptions } from './types'
import type { AudioParamLike, BaseAudioContextLike, GainNodeLike, OscillatorNodeLike } from './webAudio'
import {
  DEFAULT_FREQUENCY_HZ,
  DEFAULT_FREQUENCY_INTERPOLATION,
  DEFAULT_GAIN,
  DEFAULT_GAIN_INTERPOLATION,
  MIN_FREQUENCY_HZ,
  SILENT_GAIN,
  STOP_FADE_S,
} from './constants'
import { isEnvelope, orderedSteps, resolveInterpolation } from './envelope'
import { applyWaveShape } from './oscillator'
import { calculateEffectiveDuration, resolveEnvelopeTiming } from './utils'

export { validateSoundDefinition } from './validation'

// Absolute AudioContext timestamps for playback phases
interface PlaybackSchedule {
  start: number
  attackEnd: number
  decayStart: number
  end: number
}

/**
 * Synthesizes and plays SoundDefinition immediately on the given context.
 * Throws RangeError if `volume` is negative or `pitchScale` is not positive.
 */
export function playSoundFromDefinition(
  audioContext: BaseAudioContextLike,
  soundDefinition: SoundDefinition,
  options: StandaloneSoundOptions = {},
): PlaybackHandle {
  const volume = requireNonNegative(options.volume, 1, 'volume')
  const pitchScale = requirePositive(options.pitchScale, 1, 'pitchScale')

  const schedule = resolveSchedule(soundDefinition, audioContext.currentTime)

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  gainNode.connect(options.destination ?? audioContext.destination)
  oscillator.connect(gainNode)
  applyWaveShape(audioContext, oscillator, soundDefinition)

  scheduleFrequency(oscillator.frequency, soundDefinition.frequency, pitchScale, schedule)
  scheduleGain(gainNode.gain, soundDefinition.gain ?? DEFAULT_GAIN, volume, schedule)

  return startPlayback(audioContext, oscillator, gainNode, schedule)
}

function requireNonNegative(value: number | undefined, fallback: number, label: string): number {
  if (value === undefined) {
    return fallback
  }
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`Invalid ${label}: ${value}. Must be a finite number of at least 0.`)
  }
  return value
}

function requirePositive(value: number | undefined, fallback: number, label: string): number {
  if (value === undefined) {
    return fallback
  }
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`Invalid ${label}: ${value}. Must be a finite number greater than 0.`)
  }
  return value
}

function resolveSchedule(def: SoundDefinition, now: number): PlaybackSchedule {
  const duration = calculateEffectiveDuration(def)
  const { attack, decayStartTime } = resolveEnvelopeTiming(def, duration)

  return {
    start: now,
    attackEnd: now + attack,
    decayStart: now + decayStartTime,
    end: now + duration,
  }
}

function scheduleFrequency(
  param: AudioParamLike,
  frequency: SoundDefinition['frequency'],
  pitchScale: number,
  schedule: PlaybackSchedule,
): void {
  const toHz = (value: number) => Math.max(MIN_FREQUENCY_HZ, value * pitchScale)

  if (typeof frequency === 'number') {
    param.setValueAtTime(toHz(frequency), schedule.start)
    return
  }

  if (!isEnvelope(frequency)) {
    console.error('Invalid frequency definition provided to Buzzsaw:', frequency)
    param.setValueAtTime(toHz(DEFAULT_FREQUENCY_HZ), schedule.start)
    return
  }

  const isStepped = resolveInterpolation(frequency, DEFAULT_FREQUENCY_INTERPOLATION) === 'step'
  param.setValueAtTime(toHz(frequency.start), schedule.start)
  for (const step of orderedSteps(frequency)) {
    const at = stepTime(step.time, schedule)
    if (isStepped) {
      param.setValueAtTime(toHz(step.value), at)
    }
    else {
      param.linearRampToValueAtTime(toHz(step.value), at)
    }
  }
}

function scheduleGain(
  param: AudioParamLike,
  gain: NonNullable<SoundDefinition['gain']>,
  volume: number,
  schedule: PlaybackSchedule,
): void {
  const toLevel = (value: number) => Math.max(SILENT_GAIN, value * volume)

  if (typeof gain === 'number') {
    scheduleFixedGain(param, toLevel(gain), volume, schedule)
    return
  }

  if (!isEnvelope(gain)) {
    console.error('Invalid gain definition provided to Buzzsaw:', gain)
    scheduleFixedGain(param, toLevel(DEFAULT_GAIN), volume, schedule)
    return
  }

  const isStepped = resolveInterpolation(gain, DEFAULT_GAIN_INTERPOLATION) === 'step'
  param.setValueAtTime(toLevel(gain.start), schedule.start)

  const steps = orderedSteps(gain)
  for (const step of steps) {
    const at = stepTime(step.time, schedule)
    if (isStepped) {
      param.setValueAtTime(toLevel(step.value), at)
    }
    else {
      param.linearRampToValueAtTime(toLevel(step.value), at)
    }
  }

  const lastStep = steps[steps.length - 1]
  const endsAboveSilence = lastStep && lastStep.value > SILENT_GAIN
    && schedule.start + lastStep.time < schedule.end

  if (endsAboveSilence) {
    // Exponential ramp down to silence prevents clicks
    const rampStart = Math.max(schedule.start + lastStep.time, schedule.decayStart)
    param.setValueAtTime(toLevel(lastStep.value), rampStart)
    param.exponentialRampToValueAtTime(SILENT_GAIN, schedule.end)
  }
  else {
    param.setValueAtTime(SILENT_GAIN, schedule.end)
  }
}

function scheduleFixedGain(
  param: AudioParamLike,
  peak: number,
  volume: number,
  schedule: PlaybackSchedule,
): void {
  if (volume <= SILENT_GAIN) {
    param.setValueAtTime(SILENT_GAIN, schedule.start)
    param.setValueAtTime(SILENT_GAIN, schedule.end)
    return
  }

  param.setValueAtTime(SILENT_GAIN, schedule.start)
  param.linearRampToValueAtTime(peak, schedule.attackEnd)
  if (schedule.decayStart > schedule.attackEnd) {
    param.setValueAtTime(peak, schedule.decayStart)
  }
  param.exponentialRampToValueAtTime(SILENT_GAIN, schedule.end)
}

function stepTime(offsetSeconds: number, schedule: PlaybackSchedule): number {
  return Math.min(schedule.end, schedule.start + Math.max(0, offsetSeconds))
}

function startPlayback(
  audioContext: BaseAudioContextLike,
  oscillator: OscillatorNodeLike,
  gainNode: GainNodeLike,
  schedule: PlaybackSchedule,
): PlaybackHandle {
  let isPlaying = true
  let resolvePromise: () => void = () => { }
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve
  })

  const disconnect = () => {
    try {
      oscillator.disconnect()
      gainNode.disconnect()
    }
    catch {
      // Ignore errors if context closed before disconnect
    }
  }

  const durationSec = Math.max(0, schedule.end - schedule.start)
  let safetyTimeout: ReturnType<typeof setTimeout> | undefined

  const finish = () => {
    if (!isPlaying) {
      return
    }
    if (safetyTimeout !== undefined) {
      clearTimeout(safetyTimeout)
    }
    isPlaying = false
    disconnect()
    resolvePromise()
  }

  // Safety timeout in case browser delays oscillator.onended
  safetyTimeout = setTimeout(() => {
    finish()
  }, Math.max(100, Math.ceil((durationSec + 0.1) * 1000)))

  oscillator.onended = finish

  try {
    oscillator.start(schedule.start)
    oscillator.stop(schedule.end)
  }
  catch (e) {
    console.error('Failed to start oscillator in Buzzsaw:', e)
    finish()
  }

  const stop = () => {
    if (!isPlaying) {
      return
    }
    clearTimeout(safetyTimeout)
    isPlaying = false
    try {
      const now = audioContext.currentTime
      gainNode.gain.cancelScheduledValues?.(now)
      gainNode.gain.setValueAtTime(gainNode.gain.value ?? SILENT_GAIN, now)
      gainNode.gain.linearRampToValueAtTime(SILENT_GAIN, now + STOP_FADE_S)
      oscillator.stop(now + STOP_FADE_S + 0.001)
    }
    catch {
      // Context closed or node already stopped
    }
    disconnect()
    resolvePromise()
  }

  return {
    stop,
    get isPlaying() {
      return isPlaying
    },
    promise,
  }
}
