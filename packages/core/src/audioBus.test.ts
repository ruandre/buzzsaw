import type { MockAudioContext } from './testing/mockAudioContext.js'
import { describe, expect, it, vi } from 'vitest'
import { AudioBus } from './audioBus.js'
import { createMockAudioContext } from './testing/mockAudioContext.js'

describe('audioBus', () => {
  it('runs fader into meter into destination by default', () => {
    const ctx = createMockAudioContext()
    const bus = new AudioBus(ctx)

    expect(ctx.createDynamicsCompressor).not.toHaveBeenCalled()
    expect(bus.input).toBe(ctx.gainNodes[0])
    expect(ctx.gainNodes[0].connect).toHaveBeenCalledWith(vi.mocked(ctx.createAnalyser).mock.results[0].value)
  })

  it('inserts the limiter between fader and meter when asked', () => {
    const ctx = createMockAudioContext()
    const bus = new AudioBus(ctx, true)

    expect(bus.input).toBe(ctx.gainNodes[0])
    const limiter = vi.mocked(ctx.createDynamicsCompressor).mock.results[0].value
    expect(ctx.gainNodes[0].connect).toHaveBeenCalledWith(limiter)
    expect(limiter.threshold.value).toBe(-3)
    expect(limiter.ratio.value).toBe(20)
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
    expect(vi.mocked(ctx.createDynamicsCompressor).mock.results[0].value.disconnect).toHaveBeenCalled()
  })
})

function feedAnalyser(ctx: MockAudioContext, fill: (samples: Float32Array) => void): void {
  const analyser = vi.mocked(ctx.createAnalyser).mock.results[0].value
  vi.mocked(analyser.getFloatTimeDomainData).mockImplementation((samples: Float32Array) => {
    samples.fill(0)
    fill(samples)
  })
}
