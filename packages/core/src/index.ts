export { AudioBus } from './audioBus.js'
export {
  closeAudioContext,
  ensureAudioContextReady,
  getAudioContextClass,
  getAudioContextInstance,
  isAudioContextSupported,
  setAudioContextInstance,
} from './audioManager.js'
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
  MAX_FREQUENCY_HZ,
  MAX_GAIN,
  MAX_PARTIALS,
  MIN_DURATION_S,
  WAVE_TYPES,
} from './constants.js'
export { isEnvelope } from './envelope.js'
export { clamp, round } from './numeric.js'
export { evaluateWaveShape, resolvePartials } from './oscillator.js'
export { Sound } from './Sound.js'
export { SoundManager } from './SoundManager.js'
export type { SoundRegistrations } from './SoundManager.js'
export { playSoundFromDefinition } from './soundPlayer.js'
export { SoundValidationError } from './SoundValidationError.js'
export * from './types.js'
export {
  calculateEffectiveDuration,
  cloneSoundDefinition,
  freezeSoundDefinition,
  isValidSoundDefinition,
  resolveEnvelopeTiming,
  sampleFrequencyAtTime,
  sampleGainAtTime,
} from './utils.js'
export { validateSoundDefinition } from './validation.js'
