import { LIMITER_THRESHOLD_DB, MASTER_VOLUME_GLIDE_S, SILENT_GAIN } from './constants'

/** Master output stage: fader, optional brickwall limiter, and peak meter tap */
export class AudioBus {
  private readonly gainNode: GainNode
  private readonly analyserNode: AnalyserNode | null
  private readonly nodes: AudioNode[]
  private readonly samples: Float32Array<ArrayBuffer> | null

  constructor(audioContext: BaseAudioContext, limiter = false) {
    this.gainNode = audioContext.createGain()
    this.nodes = [this.gainNode]

    if (limiter) {
      this.nodes.push(createLimiter(audioContext))
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

  get input(): AudioNode {
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

function createLimiter(audioContext: BaseAudioContext): DynamicsCompressorNode {
  const limiter = audioContext.createDynamicsCompressor()
  limiter.threshold.value = LIMITER_THRESHOLD_DB
  limiter.knee.value = 0
  limiter.ratio.value = 20
  limiter.attack.value = 0.002
  limiter.release.value = 0.1
  return limiter
}

function createAnalyser(audioContext: BaseAudioContext): AnalyserNode | null {
  if (typeof audioContext.createAnalyser !== 'function') {
    return null
  }
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 1024
  analyser.smoothingTimeConstant = 0
  return analyser
}
