import type { MockAudioContext } from './testing/mockAudioContext.js'
import { describe, expect, it, vi } from 'vitest'
import { AudioBus } from './audioBus.js'
import { SOFT_CLIP_HEADROOM } from './constants.js'
import { createSoftClipCurve } from './softClip.js'
import { createMockAudioContext } from './testing/mockAudioContext.js'

describe('audioBus', () => {
  it('runs fader into meter into destination by default', () => {
    const ctx = createMockAudioContext()
    const bus = new AudioBus(ctx)

    expect(ctx.createWaveShaper).not.toHaveBeenCalled()
    expect(bus.input).toBe(ctx.gainNodes[0])
    expect(ctx.gainNodes[0].connect).toHaveBeenCalledWith(vi.mocked(ctx.createAnalyser).mock.results[0].value)
  })

  it('inserts the soft clipper between fader and meter when asked', () => {
    const ctx = createMockAudioContext()
    const bus = new AudioBus(ctx, true)

    const [fader, headroom] = ctx.gainNodes
    const shaper = vi.mocked(ctx.createWaveShaper).mock.results[0].value
    const analyser = vi.mocked(ctx.createAnalyser).mock.results[0].value
    expect(bus.input).toBe(fader)
    expect(fader.connect).toHaveBeenCalledWith(headroom)
    expect(headroom.connect).toHaveBeenCalledWith(shaper)
    expect(shaper.connect).toHaveBeenCalledWith(analyser)
  })

  it('clips through a stateless curve, so one sound never ducks the next', () => {
    const ctx = createMockAudioContext()
    void new AudioBus(ctx, true)

    const shaper = vi.mocked(ctx.createWaveShaper).mock.results[0].value
    expect(ctx.gainNodes[1].gain.value).toBe(1 / SOFT_CLIP_HEADROOM)
    expect(shaper.curve).toEqual(createSoftClipCurve())
    expect(shaper.oversample).toBe('none')
  })

  it('still passes audio unclipped on a context that offers no wave shaper', () => {
    const ctx = createMockAudioContext()
    Reflect.deleteProperty(ctx, 'createWaveShaper')
    void new AudioBus(ctx, true)

    expect(ctx.gainNodes).toHaveLength(1)
    expect(ctx.gainNodes[0].connect).toHaveBeenCalledWith(vi.mocked(ctx.createAnalyser).mock.results[0].value)
  })

  it('glides to a new level instead of stepping, so a drag does not zipper', () => {
    const ctx = createMockAudioContext()
    const bus = new AudioBus(ctx)

    bus.setVolume(0.4, 2)

    expect(ctx.gainNodes[0].gain.setTargetAtTime).toHaveBeenCalledWith(0.4, 2, expect.any(Number))
  })

  it('clamps a negative level to silence rather than inverting the signal', () => {
    const ctx = createMockAudioContext()
    const bus = new AudioBus(ctx)

    bus.setVolume(-1, 0)

    expect(ctx.gainNodes[0].gain.setTargetAtTime).toHaveBeenCalledWith(0, 0, expect.any(Number))
  })

  it('reports the loudest excursion, in either direction', () => {
    const ctx = createMockAudioContext()
    const bus = new AudioBus(ctx)

    feedAnalyser(ctx, (samples) => {
      samples[0] = -0.75
      samples[1] = 0.5
    })

    expect(bus.readPeakLevel()).toBeCloseTo(0.75)
  })

  it('reads silence as zero rather than a dithered floor', () => {
    const ctx = createMockAudioContext()
    const bus = new AudioBus(ctx)

    feedAnalyser(ctx, samples => samples.fill(0.00001))

    expect(bus.readPeakLevel()).toBe(0)
  })

  it('still passes audio on a context that offers no analyser', () => {
    const ctx = createMockAudioContext()
    Reflect.deleteProperty(ctx, 'createAnalyser')
    const bus = new AudioBus(ctx)

    expect(bus.readPeakLevel()).toBe(0)
    expect(ctx.gainNodes[0].connect).toHaveBeenCalledWith(ctx.destination)
  })

  it('releases every node on dispose', () => {
    const ctx = createMockAudioContext()
    const bus = new AudioBus(ctx, true)

    bus.dispose()
    bus.dispose()

    expect(ctx.gainNodes[0].disconnect).toHaveBeenCalled()
    expect(ctx.gainNodes[1].disconnect).toHaveBeenCalled()
    expect(vi.mocked(ctx.createWaveShaper).mock.results[0].value.disconnect).toHaveBeenCalled()
  })
})

function feedAnalyser(ctx: MockAudioContext, fill: (samples: Float32Array) => void): void {
  const analyser = vi.mocked(ctx.createAnalyser).mock.results[0].value
  vi.mocked(analyser.getFloatTimeDomainData).mockImplementation((samples: Float32Array) => {
    samples.fill(0)
    fill(samples)
  })
}
