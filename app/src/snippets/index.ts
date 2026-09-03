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

await sounds.play('${firstName ?? 'customSound'}')`,
  }
}

export function buildSnippets(name: string, definition: SoundDefinition): Snippet[] {
  const soundName = name || 'customSound'
  const identifier = toIdentifier(soundName)
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
const sounds = new SoundManager().register('${soundName}', ${json})
await sounds.play('${soundName}')

// Or hold a single sound directly
const ${identifier} = new Sound('${soundName}', ${json})
const handle = await ${identifier}.play({ volume: 0.8 })
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
await WavExporter.downloadWav(definition, '${soundName}.wav')

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

  // Envelopes may run past \`duration\`; the sound lasts as long as its last step
  const lastStep = param =>
    typeof param === 'object' && param !== null && Array.isArray(param.steps)
      ? Math.max(0, ...param.steps.map(step => step.time))
      : 0
  const duration = Math.max(
    def.duration ?? 0.5,
    lastStep(def.frequency),
    lastStep(def.gain),
  )
  // Clamped so an attack and decay that overrun the sound cannot schedule
  // automation out of order, which throws
  const attack = Math.min(def.attack ?? 0.005, duration)
  const decay = Math.min(def.decay ?? 0.1, duration - attack)
  const start = ctx.currentTime
  const decayStart = start + Math.max(attack, duration - decay)
  const end = start + duration

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  ${waveSetup}
  osc.connect(gain).connect(ctx.destination)

  // Pitch: a fixed value, or a ramp through each step
  if (typeof def.frequency === 'number') {
    osc.frequency.setValueAtTime(def.frequency, start)
  } else {
    osc.frequency.setValueAtTime(def.frequency.start, start)
    for (const step of [...def.frequency.steps].sort((a, b) => a.time - b.time)) {
      osc.frequency.linearRampToValueAtTime(step.value, Math.min(end, start + step.time))
    }
  }

  // Level: attack up, hold, then decay to silence, or hold each envelope step
  const level = def.gain ?? 0.5
  if (typeof level === 'number') {
    gain.gain.setValueAtTime(SILENT, start)
    gain.gain.linearRampToValueAtTime(Math.max(SILENT, level), start + attack)
    gain.gain.setValueAtTime(Math.max(SILENT, level), decayStart)
    gain.gain.exponentialRampToValueAtTime(SILENT, end)
  } else {
    const steps = [...level.steps].sort((a, b) => a.time - b.time)
    gain.gain.setValueAtTime(Math.max(SILENT, level.start), start)
    for (const step of steps) {
      gain.gain.setValueAtTime(Math.max(SILENT, step.value), Math.min(end, start + step.time))
    }
    const last = steps[steps.length - 1]
    if (last && last.value > SILENT && start + last.time < end) {
      // Ride the final step down instead of cutting it off, which clicks
      gain.gain.setValueAtTime(Math.max(SILENT, last.value), Math.max(start + last.time, decayStart))
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
