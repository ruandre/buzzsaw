import { describe, expect, it } from 'vitest'
import { SOFT_CLIP_HEADROOM, SOFT_CLIP_THRESHOLD } from './constants.js'
import { createSoftClipCurve, softClip } from './softClip.js'

function sweep(from: number, to: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => from + ((to - from) * i) / (count - 1))
}

describe('softClip', () => {
  it('passes every level at or below the threshold through untouched', () => {
    for (const x of sweep(-SOFT_CLIP_THRESHOLD, SOFT_CLIP_THRESHOLD, 10_001)) {
      expect(softClip(x)).toBe(x)
    }
  })

  it('never reaches full scale, however hot the input', () => {
    for (const x of [...sweep(-1000, 1000, 10_001), Number.MAX_VALUE, -Number.MAX_VALUE]) {
      expect(Math.abs(softClip(x))).toBeLessThanOrEqual(1)
    }
  })

  it('never turns a louder input into a quieter output', () => {
    const levels = sweep(-8, 8, 20_001)
    for (let i = 1; i < levels.length; i++) {
      expect(softClip(levels[i])).toBeGreaterThanOrEqual(softClip(levels[i - 1]))
    }
  })

  it('treats both polarities alike, so it adds no DC offset', () => {
    for (const x of sweep(0, 8, 2_001)) {
      expect(softClip(-x)).toBe(-softClip(x))
    }
  })

  it('bends without a kink at the threshold, so clipping onset adds no click', () => {
    const step = 1e-6
    const slopeAbove = (softClip(SOFT_CLIP_THRESHOLD + step) - softClip(SOFT_CLIP_THRESHOLD)) / step
    expect(slopeAbove).toBeCloseTo(1, 4)
  })
})

describe('createSoftClipCurve', () => {
  const curve = createSoftClipCurve()

  it('has a sample at exactly zero input, so silence stays silent', () => {
    expect(curve.length % 2).toBe(1)
    expect(curve[(curve.length - 1) / 2]).toBe(0)
  })

  it('spans the headroom, applying the gain its pre-attenuation removes', () => {
    const inputAt = (index: number) => ((2 * index) / (curve.length - 1) - 1) * SOFT_CLIP_HEADROOM
    for (let i = 0; i < curve.length; i++) {
      expect(curve[i]).toBeCloseTo(softClip(inputAt(i)), 6)
    }
  })

  it('stays linear below the threshold, so interpolation between samples is exact', () => {
    const center = (curve.length - 1) / 2
    const step = SOFT_CLIP_HEADROOM / center
    const lastLinear = Math.floor(SOFT_CLIP_THRESHOLD / step)
    for (let offset = -lastLinear; offset <= lastLinear; offset++) {
      expect(curve[center + offset]).toBeCloseTo(offset * step, 6)
    }
  })

  it('returns a fresh curve each call, so one bus cannot alter another', () => {
    expect(createSoftClipCurve()).not.toBe(createSoftClipCurve())
  })
})
