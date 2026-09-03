<script setup lang="ts">
import type { SoundDefinition } from '@rjvr/buzzsaw'
import { calculateEffectiveDuration, evaluateWaveShape, sampleFrequencyAtTime, sampleGainAtTime } from '@rjvr/buzzsaw'
import { useElementSize, useElementVisibility, usePreferredReducedMotion } from '@vueuse/core'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useUiStore } from '../stores'
import { getScopeTheme } from '../theme/waveform'

const props = withDefaults(defineProps<{
  definition: SoundDefinition
  isPlaying?: boolean
  height?: number
  /** Toggles duration/waveform corner chip */
  showReadout?: boolean
}>(), {
  isPlaying: false,
  height: 160,
  showReadout: true,
})

// Oversampling factor to avoid aliasing artifacts in dense waveforms
const SAMPLES_PER_PIXEL = 8
const MAX_SAMPLES = 12000
// Fraction of canvas height allocated to waveform trace
const AMPLITUDE_RATIO = 0.41
const TIME_DIVISIONS = 6
const PLAYHEAD_TRAIL_PX = 35
// Minimum pixel thickness for visible slow waves
const MIN_TRACE_THICKNESS_PX = 1.6
const SILENCE_FLOOR = 0.001
const SQUARE_TRACE_SCALE = 0.82

const ui = useUiStore()
const reducedMotion = usePreferredReducedMotion()

const container = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const { width } = useElementSize(container)

// Renders canvas only when near viewport for performance across large grids
const isVisible = useElementVisibility(container, { rootMargin: '300px' })

let animationFrame: number | null = null
let playStartedAt = 0

const durationMs = computed(() => Math.round(calculateEffectiveDuration(props.definition) * 1000))

const ariaLabel = computed(() => {
  const { waveType = 'sine', frequency } = props.definition
  const pitch = typeof frequency === 'number' ? `${frequency} Hz` : 'a modulated pitch'
  return `${waveType} waveform at ${pitch}, ${durationMs.value} milliseconds`
})

interface TraceColumn {
  x: number
  top: number
  bottom: number
  envelopeY: number
}

// Scales square waves slightly to prevent clipping envelope boundary
function evaluateOscillator(definition: SoundDefinition, phase: number): number {
  const value = evaluateWaveShape(definition, phase)
  return definition.waveType === 'square' ? value * SQUARE_TRACE_SCALE : value
}

// Samples waveform into min/max pixel columns with phase integration
function traceWaveform(canvasWidth: number, canvasHeight: number): TraceColumn[] {
  const definition = props.definition
  const duration = calculateEffectiveDuration(definition)
  const columnCount = Math.max(1, Math.round(canvasWidth))
  const samplesPerColumn = Math.max(
    1,
    Math.min(SAMPLES_PER_PIXEL, Math.floor(MAX_SAMPLES / columnCount)),
  )

  const raw: { highest: number, lowest: number, level: number }[] = []
  let peak = 0
  let phase = 0
  let previousTime = 0

  for (let column = 0; column < columnCount; column++) {
    let highest = 0
    let lowest = 0
    let level = 0

    for (let sample = 0; sample < samplesPerColumn; sample++) {
      const progress = (column + sample / samplesPerColumn) / columnCount
      const time = progress * duration
      phase += 2 * Math.PI * sampleFrequencyAtTime(definition, time) * (time - previousTime)
      previousTime = time

      level = sampleGainAtTime(definition, time, duration)
      const value = evaluateOscillator(definition, phase) * level
      highest = Math.max(highest, value)
      lowest = Math.min(lowest, value)
    }

    peak = Math.max(peak, highest, -lowest, level)
    raw.push({ highest, lowest, level })
  }

  const centerY = canvasHeight / 2
  const amplitude = (canvasHeight * AMPLITUDE_RATIO) / Math.max(peak, SILENCE_FLOOR)
  const halfThickness = MIN_TRACE_THICKNESS_PX / 2

  return raw.map(({ highest, lowest, level }, column) => {
    const center = ((highest + lowest) / 2) * amplitude
    const reach = Math.max(halfThickness, ((highest - lowest) / 2) * amplitude)
    return {
      x: column,
      top: centerY - center - reach,
      bottom: centerY - center + reach,
      envelopeY: centerY - level * amplitude,
    }
  })
}

function draw(): void {
  const element = canvas.value
  const context = element?.getContext('2d')
  if (!element || !context || !isVisible.value) {
    return
  }

  const dpr = window.devicePixelRatio || 1
  const canvasWidth = Math.max(1, Math.round(width.value) || element.clientWidth)
  const canvasHeight = props.height

  element.width = Math.round(canvasWidth * dpr)
  element.height = Math.round(canvasHeight * dpr)
  element.style.height = `${canvasHeight}px`

  const theme = getScopeTheme({ isPlaying: props.isPlaying })
  const columns = traceWaveform(canvasWidth, canvasHeight)

  context.save()
  context.scale(dpr, dpr)

  context.fillStyle = theme.background
  context.fillRect(0, 0, canvasWidth, canvasHeight)

  drawGraticule(context, canvasWidth, canvasHeight, theme)
  drawEnvelope(context, columns, canvasWidth, canvasHeight, theme)
  drawTrace(context, columns, canvasWidth, theme)

  if (props.isPlaying && reducedMotion.value !== 'reduce') {
    drawPlayhead(context, canvasWidth, canvasHeight, theme)
  }

  if (props.showReadout) {
    drawReadout(context, theme)
  }

  context.restore()
}

type ScopeTheme = ReturnType<typeof getScopeTheme>

function drawGraticule(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  theme: ScopeTheme,
): void {
  context.strokeStyle = theme.grid
  context.lineWidth = 1
  context.beginPath()
  for (const ratio of [0.15, 0.85]) {
    context.moveTo(0, canvasHeight * ratio)
    context.lineTo(canvasWidth, canvasHeight * ratio)
  }
  for (let division = 1; division < TIME_DIVISIONS; division++) {
    const x = (canvasWidth / TIME_DIVISIONS) * division
    context.moveTo(x, 0)
    context.lineTo(x, canvasHeight)
  }
  context.stroke()

  context.strokeStyle = theme.axis
  context.beginPath()
  context.moveTo(0, canvasHeight / 2)
  context.lineTo(canvasWidth, canvasHeight / 2)
  context.stroke()
}

// Fills between envelope and mirror, then dashes upper boundary
function drawEnvelope(
  context: CanvasRenderingContext2D,
  columns: TraceColumn[],
  canvasWidth: number,
  canvasHeight: number,
  theme: ScopeTheme,
): void {
  context.fillStyle = theme.envelopeFill
  context.beginPath()
  context.moveTo(0, canvasHeight / 2)
  for (const column of columns) {
    context.lineTo(column.x, column.envelopeY)
  }
  context.lineTo(canvasWidth, canvasHeight / 2)
  for (let i = columns.length - 1; i >= 0; i--) {
    context.lineTo(columns[i].x, canvasHeight - columns[i].envelopeY)
  }
  context.closePath()
  context.fill()

  context.strokeStyle = theme.envelopeLine
  context.lineWidth = 1
  context.setLineDash([3, 3])
  context.beginPath()
  columns.forEach((column, index) => {
    if (index === 0) {
      context.moveTo(column.x, column.envelopeY)
    }
    else {
      context.lineTo(column.x, column.envelopeY)
    }
  })
  context.stroke()
  context.setLineDash([])
}

// Draws trace as filled band between column extremes
function traceBandPath(context: CanvasRenderingContext2D, columns: TraceColumn[]): void {
  context.beginPath()
  context.moveTo(columns[0].x, columns[0].top)
  for (const column of columns) {
    context.lineTo(column.x, column.top)
  }
  for (let i = columns.length - 1; i >= 0; i--) {
    context.lineTo(columns[i].x, columns[i].bottom)
  }
  context.closePath()
}

function drawTrace(
  context: CanvasRenderingContext2D,
  columns: TraceColumn[],
  canvasWidth: number,
  theme: ScopeTheme,
): void {
  if (columns.length === 0) {
    return
  }

  const gradient = context.createLinearGradient(0, 0, canvasWidth, 0)
  gradient.addColorStop(0, theme.trace[0])
  gradient.addColorStop(0.5, theme.trace[1])
  gradient.addColorStop(1, theme.trace[2])

  // Phosphor bloom pass in dark mode
  if (theme.glowBlur > 0) {
    context.save()
    context.shadowColor = theme.glow
    context.shadowBlur = theme.glowBlur
    context.fillStyle = theme.trace[1]
    traceBandPath(context, columns)
    context.fill()
    context.restore()
  }

  context.fillStyle = gradient
  traceBandPath(context, columns)
  context.fill()
}

// Draws duration and waveform readout chip
function drawReadout(context: CanvasRenderingContext2D, theme: ScopeTheme): void {
  const text = `${durationMs.value}ms · ${props.definition.waveType ?? 'sine'}`
  context.font = '10px "Geist Mono Variable", ui-monospace, monospace'

  const padding = 4
  const width = context.measureText(text).width + padding * 2

  context.fillStyle = theme.chip
  context.fillRect(4, 4, width, 14)

  context.fillStyle = theme.label
  context.fillText(text, 4 + padding, 14)
}

function drawPlayhead(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  theme: ScopeTheme,
): void {
  const elapsed = (performance.now() - playStartedAt) / 1000
  const progress = Math.min(1, elapsed / calculateEffectiveDuration(props.definition))
  const x = progress * canvasWidth

  const trailStart = Math.max(0, x - PLAYHEAD_TRAIL_PX)
  const trail = context.createLinearGradient(trailStart, 0, x, 0)
  trail.addColorStop(0, 'transparent')
  trail.addColorStop(1, theme.playheadTrail)
  context.fillStyle = trail
  context.fillRect(trailStart, 0, x - trailStart, canvasHeight)

  context.strokeStyle = theme.playhead
  context.lineWidth = 1.5
  context.beginPath()
  context.moveTo(x, 0)
  context.lineTo(x, canvasHeight)
  context.stroke()

  context.fillStyle = theme.playhead
  context.beginPath()
  context.arc(x, canvasHeight / 2, 3, 0, 2 * Math.PI)
  context.fill()
}

function animate(): void {
  draw()
  animationFrame = requestAnimationFrame(animate)
}

function stopAnimation(): void {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}

watch(() => props.isPlaying, (playing) => {
  stopAnimation()
  if (playing) {
    playStartedAt = performance.now()
    animate()
  }
  else {
    draw()
  }
})

// Redraws on visibility, resize, definition, or theme changes
watch([isVisible, width, () => props.definition, () => ui.isDark], () => {
  if (animationFrame === null) {
    draw()
  }
}, { deep: true, immediate: true, flush: 'post' })

onUnmounted(stopAnimation)
</script>

<template>
  <div
    ref="container"
    class="relative w-full overflow-hidden border border-line rounded-lg bg-surface-muted shadow-bezel"
  >
    <canvas ref="canvas" role="img" :aria-label="ariaLabel" class="block h-full w-full" />
  </div>
</template>
