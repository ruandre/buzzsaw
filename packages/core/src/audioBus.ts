import type { AnalyserNodeLike, AudioNodeLike, BaseAudioContextLike, GainNodeLike } from './webAudio.js'
import { MASTER_VOLUME_GLIDE_S, SILENT_GAIN, SOFT_CLIP_HEADROOM } from './constants.js'
import { createSoftClipCurve } from './softClip.js'

/** Master output stage: fader, optional soft clipper, and peak meter tap */
export class AudioBus {
  private readonly gainNode: GainNodeLike
  private readonly analyserNode: AnalyserNodeLike | null
  private readonly nodes: AudioNodeLike[]
  private readonly samples: Float32Array<ArrayBuffer> | null

  constructor(audioContext: BaseAudioContextLike, limiter = false, initialVolume = 1) {
    this.gainNode = audioContext.createGain()
    // Set before any voice connects; a glide from default 1 would leak full scale
    this.gainNode.gain.value = Math.max(0, initialVolume)
    this.nodes = [this.gainNode]

    if (limiter) {
      this.nodes.push(...createSoftClipper(audioContext))
    }

    this.analyserNode = createAnalyser(audioContext)
    if (this.analyserNode) {
      this.nodes.push(this.analyserNode)
    }

    this.samples = this.analyserNode ? new Float32Array(this.analyserNode.fftSize) : null

    for (let i = 0; i < this.nodes.length - 1; i++) {
      this.nodes[i].connect(this.nodes[i + 1])
    }
    this.nodes[this.nodes.length - 1].connect(audioContext.destination)
  }

  get input(): AudioNodeLike {
    return this.gainNode
  }

  /** Ramps volume to avoid zipper noise */
  setVolume(volume: number, atTime: number): void {
    const target = Math.max(0, volume)
    if (typeof this.gainNode.gain.setTargetAtTime === 'function') {
      this.gainNode.gain.setTargetAtTime(target, atTime, MASTER_VOLUME_GLIDE_S)
      return
    }
    this.gainNode.gain.value = target
  }

  /** Peak amplitude [0..1] across analysis window; 0 if unmetered */
  readPeakLevel(): number {
    if (!this.analyserNode || !this.samples) {
      return 0
    }

    this.analyserNode.getFloatTimeDomainData(this.samples)

    let peak = 0
    for (const sample of this.samples) {
      const magnitude = Math.abs(sample)
      if (magnitude > peak) {
        peak = magnitude
      }
    }
    return peak > SILENT_GAIN ? Math.min(1, peak) : 0
  }

  /** Disconnects all nodes in chain; idempotent */
  dispose(): void {
    for (const node of this.nodes) {
      try {
        node.disconnect()
      }
      catch {
        // Context may already be closed
      }
    }
  }
}

// Stateless by design: DynamicsCompressorNode detection differs per browser, and Firefox's crushes harmonic-rich voices
function createSoftClipper(audioContext: BaseAudioContextLike): AudioNodeLike[] {
  if (typeof audioContext.createWaveShaper !== 'function') {
    return []
  }
  // Curve input is clamped to [-1, 1]; attenuating first lets the curve cover hotter levels
  const headroom = audioContext.createGain()
  headroom.gain.value = 1 / SOFT_CLIP_HEADROOM
  const shaper = audioContext.createWaveShaper()
  shaper.curve = createSoftClipCurve()
  // Oversampling filters would color the unity region and differ per browser
  shaper.oversample = 'none'
  return [headroom, shaper]
}

function createAnalyser(audioContext: BaseAudioContextLike): AnalyserNodeLike | null {
  if (typeof audioContext.createAnalyser !== 'function') {
    return null
  }
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 1024
  analyser.smoothingTimeConstant = 0
  return analyser
}
