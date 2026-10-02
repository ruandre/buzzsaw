import type { SoundDefinition } from '@rjvr/buzzsaw'
import { resolvePartials } from '@rjvr/buzzsaw'

export type SnippetId = 'core' | 'wav' | 'vanilla' | 'json' | 'register'

export interface Snippet {
  id: SnippetId
  label: string
  language: string
  /** Installation command or environment hint */
  hint: string
  code: string
}

function toIdentifier(name: string): string {
  const cleaned = name.replace(/\W/g, '_')
  return /^\d/.test(cleaned) ? `_${cleaned}` : cleaned || 'customSound'
}

const STRICT_RESERVED_WORDS = `arguments await break case catch class const continue debugger
  default delete do else enum eval export extends false finally for function if implements
  import in instanceof interface let new null package private protected public return static
  super switch this throw true try typeof var void while with yield`.split(/\s+/)
const CORE_SNIPPET_BINDINGS = ['Sound', 'SoundManager', 'sounds', 'handle']
const UNAVAILABLE_NAMES = new Set([...STRICT_RESERVED_WORDS, ...CORE_SNIPPET_BINDINGS])

function toVariableName(name: string): string {
  const identifier = toIdentifier(name)
  return UNAVAILABLE_NAMES.has(identifier) ? `_${identifier}` : identifier
}

function toStringLiteral(value: string): string {
  const escaped = JSON.stringify(value).slice(1, -1).replaceAll('\\"', '"').replaceAll('\'', '\\\'')
  return `'${escaped}'`
}

export function buildRegisterAllSnippet(sounds: Record<string, SoundDefinition>): Snippet {
  const names = Object.keys(sounds)
  const [firstName] = names

  return {
    id: 'register',
    label: 'Register all',
    language: 'typescript',
    hint: `${names.length} ${names.length === 1 ? 'sound' : 'sounds'} · pnpm add @rjvr/buzzsaw`,
    code: `import { SoundManager } from '@rjvr/buzzsaw'

// A manager starts empty; these are the sounds saved in your Buzzsaw library
export const sounds = new SoundManager()
  .registerAll(${JSON.stringify(sounds, null, 2)})

await sounds.play(${toStringLiteral(firstName ?? 'customSound')})`,
  }
}

export function buildSnippets(name: string, definition: SoundDefinition): Snippet[] {
  const soundName = name || 'customSound'
  const identifier = toIdentifier(soundName)
  const variableName = toVariableName(soundName)
  const nameLiteral = toStringLiteral(soundName)
  const json = JSON.stringify(definition, null, 2)
  const waveSetup = resolvePartials(definition)
    ? `osc.setPeriodicWave(ctx.createPeriodicWave(
    new Float32Array(def.partials.length + 1),
    Float32Array.from([0, ...def.partials]),
  ))`
    : `osc.type = def.waveType ?? 'sine'`

  return [
    {
      id: 'core',
      label: '@rjvr/buzzsaw',
      language: 'typescript',
      hint: 'pnpm add @rjvr/buzzsaw',
      code: `import {
  Sound,
  SoundManager,
} from '@rjvr/buzzsaw'

// Registry: name once, play anywhere
const sounds = new SoundManager().register(${nameLiteral}, ${json})
await sounds.play(${nameLiteral})

// Or hold a single sound directly
const ${variableName} = new Sound(${nameLiteral}, ${json})
const handle = await ${variableName}.play({ volume: 0.8 })
handle.stop()`,
    },
    {
      id: 'wav',
      label: '@rjvr/buzzsaw-wav',
      language: 'typescript',
      hint: 'pnpm add @rjvr/buzzsaw-wav',
      code: `import { WavExporter } from '@rjvr/buzzsaw-wav'

const definition = ${json}

// Save straight to the user's downloads
await WavExporter.downloadWav(definition, ${toStringLiteral(`${soundName}.wav`)})

// Or keep the bytes: 44.1 kHz, 16-bit mono
const blob = await WavExporter.renderToWavBlob(definition, {
  sampleRate: 44100,
  bitDepth: 16,
})`,
    },
    {
      id: 'vanilla',
      label: 'Web Audio',
      language: 'javascript',
      hint: 'No dependencies',
      code: `// The same sound, hand-rolled on the Web Audio API
const def = ${json}

async function play${identifier.charAt(0).toUpperCase()}${identifier.slice(1)}(ctx = new AudioContext()) {
  // Browsers suspend audio until the user interacts with the page. An
  // OfflineAudioContext is suspended by design and rejects resume(), so pass one
  // in to render this sound to a buffer instead of to the speakers
  if (ctx.state === 'suspended' && !('startRendering' in ctx)) {
    await ctx.resume()
  }

  // exponentialRampToValueAtTime cannot reach 0, so this is the silence floor
  const SILENT = 0.0001

  // Envelopes may run past \`duration\`; the sound then lasts 10 ms past its last step
  const lastStep = param =>
    typeof param === 'object' && param !== null && Array.isArray(param.steps)
      ? Math.max(0, ...param.steps.map(step => step.time))
      : 0
  const lastStepTime = Math.max(lastStep(def.frequency), lastStep(def.gain))
  const duration = Math.max(0.01, def.duration ?? 0.5, lastStepTime > 0 ? lastStepTime + 0.01 : 0)
  // Attack and decay are carved out of the sound, leaving at least 1 ms to decay
  const attack = Math.min(def.attack ?? 0.005, duration - 0.001)
  const decay = Math.min(def.decay ?? 0.1, duration - attack)
  const start = ctx.currentTime
  const attackEnd = start + attack
  const decayStart = start + Math.max(attack, duration - decay)
  const end = start + duration
  const byTime = steps => [...steps].sort((a, b) => a.time - b.time)
  const moveTo = (param, interpolation, value, time) =>
    interpolation === 'step'
      ? param.setValueAtTime(value, time)
      : param.linearRampToValueAtTime(value, time)

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  ${waveSetup}
  osc.connect(gain).connect(ctx.destination)

  // Pitch: a fixed value, or a glide (or jump, with 'step') to each step
  if (typeof def.frequency === 'number') {
    osc.frequency.setValueAtTime(def.frequency, start)
  } else {
    osc.frequency.setValueAtTime(def.frequency.start, start)
    for (const step of byTime(def.frequency.steps)) {
      moveTo(osc.frequency, def.frequency.interpolation ?? 'linear', step.value, start + step.time)
    }
  }

  // Level: attack up from silence, hold or follow the envelope, then decay to silence
  const level = def.gain ?? 0.5
  const toLevel = value => Math.max(SILENT, value)
  if (typeof level === 'number') {
    gain.gain.setValueAtTime(SILENT, start)
    gain.gain.linearRampToValueAtTime(toLevel(level), attackEnd)
    if (decayStart > attackEnd) {
      gain.gain.setValueAtTime(toLevel(level), decayStart)
    }
    gain.gain.exponentialRampToValueAtTime(SILENT, end)
  } else {
    const interpolation = level.interpolation ?? 'step'
    const steps = byTime(level.steps)
    const [first] = steps
    const last = steps[steps.length - 1]

    // A first step before the attack ends cuts it short
    const peakTime = first ? Math.min(attackEnd, start + first.time) : attackEnd
    // Linear attack lands on the envelope's own line, so the ramp onward has no jump
    const peak = interpolation === 'linear' && first
      ? level.start + (first.value - level.start) * (peakTime - start) / first.time
      : level.start
    if (peakTime > start) {
      gain.gain.setValueAtTime(SILENT, start)
      gain.gain.linearRampToValueAtTime(toLevel(peak), peakTime)
    } else {
      gain.gain.setValueAtTime(toLevel(level.start), start)
    }

    for (const step of steps) {
      moveTo(gain.gain, interpolation, toLevel(step.value), start + step.time)
    }

    // Ride the held level down instead of cutting it off, which clicks
    const held = toLevel(last ? last.value : level.start)
    const decayFrom = Math.max(start + (last ? last.time : 0), decayStart)
    if (held > SILENT && decayFrom < end) {
      gain.gain.setValueAtTime(held, decayFrom)
      gain.gain.exponentialRampToValueAtTime(SILENT, end)
    } else {
      gain.gain.setValueAtTime(SILENT, end)
    }
  }

  osc.start(start)
  osc.stop(end)

  // Browsers cap concurrent AudioContexts, so release the nodes when done
  return new Promise(resolve => {
    osc.onended = () => {
      osc.disconnect()
      gain.disconnect()
      resolve()
    }
  })
}`,
    },
    {
      id: 'json',
      label: 'JSON',
      language: 'json',
      hint: 'SoundDefinition schema',
      code: json,
    },
  ]
}
