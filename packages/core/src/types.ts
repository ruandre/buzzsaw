import type { AudioContextLike, AudioNodeLike, BaseAudioContextLike, WaveType } from './webAudio.js'

export type {
  AudioBufferLike,
  AudioContextConstructor,
  AudioContextLike,
  AudioNodeLike,
  BaseAudioContextLike,
  OfflineAudioContextConstructor,
  OfflineAudioContextLike,
  WaveType,
} from './webAudio.js'

export interface SoundStep {
  /** Target value at this point (Hz in (0..20000], or gain [0..1]) */
  value: number
  /** Time offset in seconds from sound start */
  time: number
}

/** How values move between steps: ramped linearly, or held until the next step */
export type EnvelopeInterpolation = 'linear' | 'step'

export interface EnvelopeDefinition {
  /** Value at t=0 */
  start: number
  steps: SoundStep[]
  /** Defaults to 'linear' for frequency envelopes, 'step' for gain envelopes */
  interpolation?: EnvelopeInterpolation
}

export type FrequencyDefinition = number | EnvelopeDefinition

export type GainDefinition = number | EnvelopeDefinition

export interface SoundDefinition {
  /** Defaults to 'sine'. Noise sources are not supported */
  waveType?: WaveType
  /** Relative harmonic amplitudes for 'custom' waveType; normalized on playback */
  partials?: number[]
  frequency: FrequencyDefinition
  /**
   * Peak gain [0..1] or envelope; values above 1 are rejected, not clipped; 0 renders as
   * 0.0001, the silence floor an exponential ramp cannot cross. Defaults to 0.5
   */
  gain?: GainDefinition
  /** Total seconds, inclusive of attack and decay; envelope steps past it extend it, attack and decay never do. Defaults to 0.5 */
  duration?: number
  /**
   * Linear ramp-in from silence in seconds, carved out of `duration`; applies to an envelope gain
   * too, ramping in to its `start`; clamped to leave a 1 ms decay window. Defaults to 0.005
   */
  attack?: number
  /** Exponential ramp-out in seconds, carved out of `duration`. Defaults to 0.1 */
  decay?: number
}

export interface SoundPlaybackOptions {
  /** Volume multiplier, non-negative. Defaults to 1.0 */
  volume?: number
  /** Pitch multiplier, positive (e.g. 2.0 = octave up). Defaults to 1.0 */
  pitchScale?: number
}

/** Playback options for a `Sound` used outside a `SoundManager` */
export interface StandaloneSoundOptions extends SoundPlaybackOptions {
  /** Context to schedule on. Defaults to the shared singleton */
  audioContext?: BaseAudioContextLike
  /** Target node overriding the context destination */
  destination?: AudioNodeLike
}

export interface PlaybackHandle {
  /** Stops playback with fade-out to prevent clicks */
  stop: () => void
  readonly isPlaying: boolean
  /** Resolves when playback finishes or stops */
  readonly promise: Promise<void>
}

export interface SoundManagerOptions {
  /** Volume multiplier in [0..2]. Defaults to 1.0 */
  masterVolume?: number
  audioContext?: AudioContextLike
  /** Inserts brickwall limiter on master bus. Defaults to true */
  limiter?: boolean
  /** Called when `play` is given an unregistered name. Defaults to logging an error */
  onMissing?: (name: string) => void
}

/** Serializable bundle of named sound definitions, for import and export */
export interface SoundPack {
  version: number
  exportedAt?: string
  sounds: Record<string, SoundDefinition>
}
