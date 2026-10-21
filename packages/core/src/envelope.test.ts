import type { EnvelopeDefinition } from './types.js'
import { describe, expect, it } from 'vitest'
import {
  cloneEnvelope,
  isEnvelope,
  latestStepTime,
  orderedSteps,
  sampleEnvelope,
  sampleSteppedEnvelope,
} from './envelope.js'

const unsorted: EnvelopeDefinition = {
  start: 100,
  steps: [
    { value: 300, time: 0.3 },
    { value: 100, time: 0.1 },
    { value: 200, time: 0.2 },
  ],
}

describe('isEnvelope', () => {
  it('requires a numeric start', () => {
    expect(isEnvelope({ start: 440, steps: [] })).toBe(true)
    expect(isEnvelope({ start: '440', steps: [] })).toBe(false)
    expect(isEnvelope(null)).toBe(false)
    expect(isEnvelope(440)).toBe(false)
  })
})

describe('orderedSteps', () => {
  it('sorts steps chronologically whatever order they were authored in', () => {
    expect(orderedSteps(unsorted).map(step => step.time)).toEqual([0.1, 0.2, 0.3])
  })

  it('drops steps that are not finite numbers', () => {
    const envelope = {
      start: 1,
      steps: [
        null,
        { value: Number.NaN, time: 0.1 },
        { value: 2, time: Infinity },
        { value: 3, time: 0.3 },
      ],
    } as unknown as EnvelopeDefinition

    expect(orderedSteps(envelope)).toEqual([{ value: 3, time: 0.3 }])
  })

  it('treats missing steps as none', () => {
    expect(orderedSteps({ start: 1 } as EnvelopeDefinition)).toEqual([])
  })
})

describe('latestStepTime', () => {
  it('is zero without steps', () => {
    expect(latestStepTime({ start: 1, steps: [] })).toBe(0)
  })

  it('reports the latest time, not the last authored one', () => {
    expect(latestStepTime(unsorted)).toBe(0.3)
  })
})

describe('sampleEnvelope', () => {
  it('returns start at and before time zero', () => {
    expect(sampleEnvelope(unsorted, 0)).toBe(100)
    expect(sampleEnvelope(unsorted, -1)).toBe(100)
  })

  it('interpolates across unsorted steps in time order', () => {
    expect(sampleEnvelope(unsorted, 0.15)).toBeCloseTo(150)
    expect(sampleEnvelope(unsorted, 0.25)).toBeCloseTo(250)
  })

  it('holds the last value after the final step', () => {
    expect(sampleEnvelope(unsorted, 1)).toBe(300)
  })

  it('jumps to a step that shares its time with the previous one', () => {
    const envelope: EnvelopeDefinition = {
      start: 0,
      steps: [{ value: 1, time: 0.1 }, { value: 5, time: 0.1 }],
    }

    expect(sampleEnvelope(envelope, 0.1)).toBe(1)
    expect(sampleEnvelope(envelope, 0.2)).toBe(5)
  })

  it('treats a non-finite start as zero', () => {
    expect(sampleEnvelope({ start: Number.NaN, steps: [{ value: 1, time: 1 }] }, 0.5)).toBeCloseTo(0.5)
  })
})

describe('sampleSteppedEnvelope', () => {
  it('switches to a step exactly at its time, not before', () => {
    const envelope: EnvelopeDefinition = { start: 0, steps: [{ value: 1, time: 0.1 }] }

    expect(sampleSteppedEnvelope(envelope, 0.0999)).toBe(0)
    expect(sampleSteppedEnvelope(envelope, 0.1)).toBe(1)
  })

  it('holds the latest step in time order', () => {
    expect(sampleSteppedEnvelope(unsorted, 0.25)).toBe(200)
    expect(sampleSteppedEnvelope(unsorted, 1)).toBe(300)
  })
})

describe('cloneEnvelope', () => {
  it('copies steps so the clone is independent', () => {
    const clone = cloneEnvelope(unsorted)
    clone.steps[0].value = 999

    expect(unsorted.steps[0].value).toBe(300)
  })

  it('normalizes missing steps to an empty array', () => {
    expect(cloneEnvelope({ start: 1 } as EnvelopeDefinition).steps).toEqual([])
  })
})
