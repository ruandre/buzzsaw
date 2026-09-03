// @unocss-include

// Waveform oscilloscope theme resolved from CSS custom properties

export interface ScopeThemeOptions {
  isPlaying?: boolean
}

/** Icon mapping per oscillator wave type */
const WAVE_ICONS: Record<string, string> = {
  sine: 'i-ph-wave-sine-bold',
  square: 'i-ph-wave-square-bold',
  sawtooth: 'i-ph-wave-sawtooth-bold',
  triangle: 'i-ph-wave-triangle-bold',
}

export function getWaveIcon(waveType?: OscillatorType): string {
  return WAVE_ICONS[waveType ?? 'sine'] ?? WAVE_ICONS.sine
}

/** Color palette and chrome tokens for oscilloscope canvas */
export interface ScopeTheme {
  trace: readonly [string, string, string]
  glow: string
  glowBlur: number
  envelopeFill: string
  envelopeLine: string
  background: string
  grid: string
  axis: string
  label: string
  chip: string
  playhead: string
  playheadTrail: string
}

const themeCache = new Map<string, ScopeTheme>()

/** Resolves oscilloscope colors for active playback state and color mode */
export function getScopeTheme(options: ScopeThemeOptions = {}): ScopeTheme {
  const isPlaying = Boolean(options.isPlaying)
  const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  const cacheKey = `${isPlaying ? 'live' : 'idle'}|${mode}`

  const cached = themeCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const styles = getComputedStyle(document.documentElement)
  const channels = (name: string) => styles.getPropertyValue(`--bs-${name}`).trim()
  const color = (name: string, alpha?: number) =>
    alpha === undefined ? `rgb(${channels(name)})` : `rgb(${channels(name)} / ${alpha})`
  const number = (name: string) => Number.parseFloat(styles.getPropertyValue(`--bs-${name}`)) || 0

  const traceAlpha = number('scope-trace-alpha')

  const traceStops: [string, string, string] = isPlaying
    ? [color('accent-solid'), color('accent-bright'), color('accent-lift')]
    : [color('trace'), color('trace-soft'), color('trace')]

  const glowColor = isPlaying
    ? color('accent-bright', traceAlpha)
    : color('trace-soft', traceAlpha)

  const theme: ScopeTheme = {
    trace: traceStops,
    glow: glowColor,
    glowBlur: number('scope-glow-strength'),
    envelopeFill: isPlaying
      ? color('accent', traceAlpha * 0.15)
      : color('trace-soft', traceAlpha * 0.12),
    envelopeLine: isPlaying
      ? color('accent-lift', 0.6)
      : color('trace-soft', Math.max(0.3, traceAlpha)),
    background: color('scope-bg'),
    grid: color('scope-grid'),
    axis: color('scope-axis'),
    label: color('scope-label', 0.95),
    chip: color('scope-bg', 0.88),
    playhead: color('accent'),
    playheadTrail: color('accent', 0.2),
  }

  themeCache.set(cacheKey, theme)
  return theme
}

/** Clears cached theme; call on runtime color-mode change */
export function clearScopeThemeCache(): void {
  themeCache.clear()
}
