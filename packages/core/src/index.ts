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
  DEFAULT_FREQUENCY_INTERPOLATION,
  DEFAULT_GAIN,
  DEFAULT_GAIN_INTERPOLATION,
  DEFAULT_WAVE_TYPE,
  MASTER_VOLUME_MAX,
  MASTER_VOLUME_MIN,
  MAX_PARTIALS,
  WAVE_TYPES,
} from './constants'
export { isEnvelope } from './envelope'
export { clamp, round } from './numeric'
export { evaluateWaveShape, resolvePartials } from './oscillator'
export { Sound } from './Sound'
export { SoundManager } from './SoundManager'
export type { SoundRegistrations } from './SoundManager'
export { playSoundFromDefinition } from './soundPlayer'
export { SoundValidationError } from './SoundValidationError'
export * from './types'
export {
  calculateEffectiveDuration,
  cloneSoundDefinition,
  freezeSoundDefinition,
  isValidSoundDefinition,
  sampleFrequencyAtTime,
  sampleGainAtTime,
} from './utils'
export { validateSoundDefinition } from './validation'
