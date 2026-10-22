import type { EnvelopeInterpolation, WaveType } from './types.js'

export const WAVE_TYPES: readonly WaveType[] = ['sine', 'square', 'sawtooth', 'triangle', 'custom']

export const DEFAULT_WAVE_TYPE: WaveType = 'sine'
export const DEFAULT_FREQUENCY_HZ = 440
export const DEFAULT_GAIN = 0.5
export const DEFAULT_ENVELOPE_GAIN = 0.4
export const DEFAULT_DURATION_S = 0.5
export const DEFAULT_ATTACK_S = 0.005
export const DEFAULT_DECAY_S = 0.1

// Frequency reads as pitch glide, gain as discrete level changes
export const DEFAULT_FREQUENCY_INTERPOLATION: EnvelopeInterpolation = 'linear'
export const DEFAULT_GAIN_INTERPOLATION: EnvelopeInterpolation = 'step'

export const MIN_FREQUENCY_HZ = 1
// Above the audible range; higher pitches render as silence at every usual sample rate
export const MAX_FREQUENCY_HZ = 20000
export const MAX_GAIN = 1
export const MIN_DURATION_S = 0.01
export const MIN_DECAY_WINDOW_S = 0.001

// Headroom after the last envelope step so its target is reached before the voice ends
export const ENVELOPE_TAIL_PAD_S = 0.01

// Web Audio exponentialRampToValueAtTime rejects 0; practical silence floor
export const SILENT_GAIN = 0.0001

// Prevents clicks when stopping playback early
export const STOP_FADE_S = 0.005

// Gecko's currentTime can trail one render callback (10.7 ms at 512 frames, 48 kHz; longer on some backends)
export const GECKO_START_LEAD_S = 0.025

export const MASTER_VOLUME_MIN = 0
export const MASTER_VOLUME_MAX = 2

// Upper harmonic limit; higher partials are inaudible and waste CPU
export const MAX_PARTIALS = 64

// Prevents zipper noise on volume changes
export const MASTER_VOLUME_GLIDE_S = 0.015

// Master bus soft clip: unity gain up to -3 dBFS
export const SOFT_CLIP_THRESHOLD = 10 ** (-3 / 20)
// Curve spans input up to +12 dBFS; hotter input holds at its ceiling
export const SOFT_CLIP_HEADROOM = 4
// Odd length puts a curve sample at exactly zero input
export const SOFT_CLIP_CURVE_LENGTH = 8193
