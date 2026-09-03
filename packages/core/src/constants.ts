export const WAVE_TYPES: readonly OscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle', 'custom']

export const DEFAULT_WAVE_TYPE: OscillatorType = 'sine'
export const DEFAULT_FREQUENCY_HZ = 440
export const DEFAULT_GAIN = 0.5
export const DEFAULT_ENVELOPE_GAIN = 0.4
export const DEFAULT_DURATION_S = 0.5
export const DEFAULT_ATTACK_S = 0.005
export const DEFAULT_DECAY_S = 0.1

export const MIN_FREQUENCY_HZ = 1
export const MIN_DURATION_S = 0.01
export const MIN_DECAY_WINDOW_S = 0.001

// Web Audio exponentialRampToValueAtTime rejects 0; practical silence floor
export const SILENT_GAIN = 0.0001

// Prevents clicks when stopping playback early
export const STOP_FADE_S = 0.005

export const MASTER_VOLUME_MIN = 0
export const MASTER_VOLUME_MAX = 2

// Upper harmonic limit; higher partials are inaudible and waste CPU
export const MAX_PARTIALS = 64

// Prevents zipper noise on volume changes
export const MASTER_VOLUME_GLIDE_S = 0.015

export const LIMITER_THRESHOLD_DB = -3
