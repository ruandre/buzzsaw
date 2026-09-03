/* eslint-disable ts/method-signature-style -- method shorthand is bivariant in its
   parameters; property syntax would make these interfaces contravariant and stop real
   DOM types satisfying them under strictFunctionTypes */

// Local structural subset keeps published types free of `lib.dom`, so a Node-only
// tsconfig typechecks against a polyfill; real DOM types satisfy every member

/** Waveform shapes accepted by `OscillatorNode.type` */
export type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'custom'

// 'interrupted' is iOS Safari only, reported when the system takes over audio
export type AudioContextState = 'suspended' | 'running' | 'closed' | 'interrupted'

export interface AudioParamLike {
  value: number
  setValueAtTime(value: number, startTime: number): unknown
  linearRampToValueAtTime(value: number, endTime: number): unknown
  exponentialRampToValueAtTime(value: number, endTime: number): unknown
  setTargetAtTime?(target: number, startTime: number, timeConstant: number): unknown
  cancelScheduledValues?(cancelTime: number): unknown
}

export interface AudioNodeLike {
  connect(destination: AudioNodeLike): unknown
  disconnect(): void
}

export interface GainNodeLike extends AudioNodeLike {
  readonly gain: AudioParamLike
}

export interface OscillatorNodeLike extends AudioNodeLike {
  type: WaveType
  readonly frequency: AudioParamLike
  // Unconstrained: the event is never read, and naming DOM `Event` would pull in lib.dom
  onended: unknown
  setPeriodicWave(wave: PeriodicWaveLike): void
  start(when?: number): void
  stop(when?: number): void
}

export interface AnalyserNodeLike extends AudioNodeLike {
  fftSize: number
  smoothingTimeConstant: number
  getFloatTimeDomainData(array: Float32Array): void
}

export interface DynamicsCompressorNodeLike extends AudioNodeLike {
  readonly threshold: AudioParamLike
  readonly knee: AudioParamLike
  readonly ratio: AudioParamLike
  readonly attack: AudioParamLike
  readonly release: AudioParamLike
}

export type PeriodicWaveLike = object

export interface AudioBufferLike {
  readonly numberOfChannels: number
  readonly length: number
  readonly sampleRate: number
  readonly duration: number
  getChannelData(channel: number): Float32Array
}

/** Shared surface of `AudioContext` and `OfflineAudioContext` */
export interface BaseAudioContextLike {
  readonly currentTime: number
  readonly sampleRate: number
  readonly destination: AudioNodeLike
  createOscillator(): OscillatorNodeLike
  createGain(): GainNodeLike
  createDynamicsCompressor?(): DynamicsCompressorNodeLike
  createAnalyser?(): AnalyserNodeLike
  createPeriodicWave?(real: Float32Array, imag: Float32Array): PeriodicWaveLike
}

export interface AudioContextLike extends BaseAudioContextLike {
  readonly state: AudioContextState
  resume(): Promise<void>
  close(): Promise<void>
}

export interface OfflineAudioContextLike extends BaseAudioContextLike {
  startRendering(): Promise<AudioBufferLike>
}

export type AudioContextConstructor = new (
  options?: { latencyHint?: 'balanced' | 'interactive' | 'playback' | number }
) => AudioContextLike

export type OfflineAudioContextConstructor = new (
  numberOfChannels: number,
  length: number,
  sampleRate: number
) => OfflineAudioContextLike
