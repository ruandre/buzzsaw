export function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function clampFinite(value: unknown, min: number, max: number, fallback: number): number {
  return clamp(finiteOr(value, fallback), min, max)
}

export function atLeast(value: unknown, min: number, fallback: number): number {
  return Math.max(min, finiteOr(value, fallback))
}

export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
