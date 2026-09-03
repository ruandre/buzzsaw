export interface SoundStep {
  /** Target value at this point (Hz or gain [0..1]) */
  value: number
  /** Time offset in seconds from sound start */
  time: number
}

export interface EnvelopeDefinition {
  /** Value at t=0 */
  start: number
  /** Chronological automation points */
  steps: SoundStep[]
}

export type FrequencyDefinition = number | EnvelopeDefinition

export type GainDefinition = number | EnvelopeDefinition

export interface SoundDefinition {
  /** Defaults to 'sine' */
  waveType?: OscillatorType
  /** Relative harmonic amplitudes for 'custom' waveType; normalized on playback */
  partials?: number[]
  frequency: FrequencyDefinition
  /** Peak gain [0..1] or envelope. Defaults to 0.5 */
  gain?: GainDefinition
  /** Duration in seconds. Defaults to 0.5 */
  duration?: number
  /** Linear ramp-in in seconds. Defaults to 0.005 */
  attack?: number
  /** Exponential ramp-out in seconds. Defaults to 0.1 */
  decay?: number
}

export interface SoundPlaybackOptions {
  /** Volume multiplier. Defaults to 1.0 */
  volume?: number
  /** Pitch multiplier (e.g. 2.0 = octave up) */
  pitchScale?: number
  audioContext?: BaseAudioContext
  /** Target node overriding context destination */
  destination?: AudioNode
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
  audioContext?: AudioContext
  /** Inserts brickwall limiter on master bus; off by default */
  limiter?: boolean
}

export interface SoundPack {
  version: number
  exportedAt?: string
  sounds: Record<string, SoundDefinition>
}
