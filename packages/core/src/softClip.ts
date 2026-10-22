import { SOFT_CLIP_CURVE_LENGTH, SOFT_CLIP_HEADROOM, SOFT_CLIP_THRESHOLD } from './constants.js'

/** Unity below threshold, tanh bend above; output stays within [-1, 1] */
export function softClip(sample: number): number {
  const magnitude = Math.abs(sample)
  if (magnitude <= SOFT_CLIP_THRESHOLD) {
    return sample
  }
  const range = 1 - SOFT_CLIP_THRESHOLD
  return Math.sign(sample) * (SOFT_CLIP_THRESHOLD + range * Math.tanh((magnitude - SOFT_CLIP_THRESHOLD) / range))
}

/** WaveShaperNode curve of `softClip`, for input pre-attenuated by `SOFT_CLIP_HEADROOM` */
export function createSoftClipCurve(): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(SOFT_CLIP_CURVE_LENGTH)
  const center = (SOFT_CLIP_CURVE_LENGTH - 1) / 2
  for (let i = 0; i < curve.length; i++) {
    curve[i] = softClip(((i - center) / center) * SOFT_CLIP_HEADROOM)
  }
  return curve
}
