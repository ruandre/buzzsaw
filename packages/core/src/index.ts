export { AudioBus } from './audioBus'
export {
  closeAudioContext,
  ensureAudioContextReady,
  getAudioContextClass,
  getAudioContextInstance,
  isAudioContextSupported,
  setAudioContextInstance,
} from './audioManager'
export {
  DEFAULT_ATTACK_S,
  DEFAULT_DECAY_S,
  DEFAULT_DURATION_S,
  DEFAULT_FREQUENCY_HZ,
  DEFAULT_GAIN,
  DEFAULT_WAVE_TYPE,
  LIMITER_THRESHOLD_DB,
  MASTER_VOLUME_MAX,
  MASTER_VOLUME_MIN,
  MAX_PARTIALS,
  MIN_DURATION_S,
  MIN_FREQUENCY_HZ,
  SILENT_GAIN,
  WAVE_TYPES,
} from './constants'
export {
  cloneEnvelope,
  isEnvelope,
  latestStepTime,
  orderedSteps,
  sampleEnvelope,
  sampleSteppedEnvelope,
} from './envelope'
export { atLeast, clamp, clampFinite, finiteOr, round } from './numeric'
export { applyWaveShape, evaluateWaveShape, resolvePartials } from './oscillator'
export { Sound } from './Sound'
export { SoundManager } from './SoundManager'
export { playSoundFromDefinition } from './soundPlayer'
export * from './types'
export {
  calculateEffectiveDuration,
  cloneSoundDefinition,
  isValidSoundDefinition,
  resolveEnvelopeTiming,
  sampleFrequencyAtTime,
  sampleGainAtTime,
} from './utils'
export { validateSoundDefinition } from './validation'
