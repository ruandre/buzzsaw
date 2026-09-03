import type { EnvelopeDefinition, EnvelopeInterpolation, SoundStep } from './types'

export function isEnvelope(value: unknown): value is EnvelopeDefinition {
  return typeof value === 'object'
    && value !== null
    && 'start' in value
    && typeof (value as EnvelopeDefinition).start === 'number'
}

/** Returns finite steps sorted chronologically */
export function orderedSteps(envelope: EnvelopeDefinition): SoundStep[] {
  const steps = Array.isArray(envelope.steps) ? envelope.steps : []
  return steps
    .filter((step): step is SoundStep =>
      Boolean(step)
      && Number.isFinite(step.value)
      && Number.isFinite(step.time),
    )
    .map(step => ({ value: step.value, time: step.time }))
    .sort((a, b) => a.time - b.time)
}

/** Time offset of final step; 0 if empty */
export function latestStepTime(envelope: EnvelopeDefinition): number {
  const steps = orderedSteps(envelope)
  return steps.length > 0 ? steps[steps.length - 1].time : 0
}

export function resolveInterpolation(
  envelope: EnvelopeDefinition,
  fallback: EnvelopeInterpolation,
): EnvelopeInterpolation {
  return envelope.interpolation ?? fallback
}

/** Uses the envelope's interpolation mode, or `fallback` when it declares none */
export function sampleEnvelopeValue(
  envelope: EnvelopeDefinition,
  time: number,
  fallback: EnvelopeInterpolation,
): number {
  return resolveInterpolation(envelope, fallback) === 'step'
    ? sampleSteppedEnvelope(envelope, time)
    : sampleEnvelope(envelope, time)
}

/** Linearly interpolates envelope value at time */
export function sampleEnvelope(envelope: EnvelopeDefinition, time: number): number {
  const start = Number.isFinite(envelope.start) ? envelope.start : 0
  const steps = orderedSteps(envelope)

  if (steps.length === 0 || time <= 0) {
    return start
  }

  let previousTime = 0
  let previousValue = start

  for (const step of steps) {
    if (time <= step.time) {
      const span = step.time - previousTime
      if (span <= 0) {
        return step.value
      }
      const progress = (time - previousTime) / span
      return previousValue + (step.value - previousValue) * progress
    }
    previousTime = step.time
    previousValue = step.value
  }

  return steps[steps.length - 1].value
}

/** Samples envelope with zero-order hold (staircase) */
export function sampleSteppedEnvelope(envelope: EnvelopeDefinition, time: number): number {
  const start = Number.isFinite(envelope.start) ? envelope.start : 0
  const steps = orderedSteps(envelope)

  let held = start
  for (const step of steps) {
    if (time < step.time) {
      break
    }
    held = step.value
  }
  return held
}

export function cloneEnvelope(envelope: EnvelopeDefinition): EnvelopeDefinition {
  return {
    start: envelope.start,
    steps: Array.isArray(envelope.steps)
      ? envelope.steps.map(step => ({ value: step.value, time: step.time }))
      : [],
    interpolation: envelope.interpolation,
  }
}
