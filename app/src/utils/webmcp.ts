import type { SoundDefinition, WaveType } from '@rjvr/buzzsaw'
import { validateSoundDefinition } from '@rjvr/buzzsaw'
import { getSoundCategory, SOUND_CATEGORIES } from '../audio/categories'
import { isValidSoundName, SOUND_NAME_RULE, toCustomSoundName } from '../audio/soundName'
import { useAiStore, useLibraryStore, usePlaybackStore, useUiStore } from '../stores'

// WebMCP tool registration for in-browser AI agents

interface ToolDefinition {
  name: string
  description: string
  inputSchema: object
  execute: (input: unknown) => unknown
  annotations?: { readOnlyHint?: boolean }
}

interface ModelContext {
  registerTool: (tool: ToolDefinition, options: { signal: AbortSignal }) => void
}

const NAME_INPUT = {
  type: 'object',
  properties: { name: { type: 'string', description: 'Exact sound name.' } },
  required: ['name'],
} as const

const MISSING_NAME = 'Missing "name": the exact sound name.'

/**
 * Registers studio tools via navigator.modelContext
 * @returns Teardown function, or null if WebMCP is unsupported
 */
export function registerWebMcpTools(): (() => void) | null {
  const modelContext = resolveModelContext()
  if (!modelContext) {
    return null
  }

  const playback = usePlaybackStore()
  const library = useLibraryStore()
  const ai = useAiStore()
  const ui = useUiStore()

  const findSound = (name: string): SoundDefinition | undefined =>
    ownEntry(library.presets, name) ?? ownEntry(library.customSounds, name)

  const controller = new AbortController()
  const register = (tool: ToolDefinition) =>
    modelContext.registerTool(tool, { signal: controller.signal })

  try {
    register({
      name: 'list_sound_presets',
      description: 'Lists the built-in sound presets, optionally filtered by category or name.',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['all', ...SOUND_CATEGORIES],
            description: 'Restrict results to one category.',
          },
          search: { type: 'string', description: 'Substring matched against preset names.' },
        },
      },
      annotations: { readOnlyHint: true },
      execute(input) {
        const fields = readInput(input)
        const category = readString(fields, 'category') ?? 'all'
        const query = (readString(fields, 'search') ?? '').toLowerCase()
        return Object.entries(library.presets)
          .filter(([name]) =>
            (!query || name.toLowerCase().includes(query))
            && (category === 'all' || getSoundCategory(name) === category))
          .map(([name, definition]) => ({
            name,
            category: getSoundCategory(name),
            waveType: definition.waveType ?? 'sine',
            duration: definition.duration ?? 0.5,
          }))
      },
    })

    register({
      name: 'get_sound_definition',
      description: 'Returns the full JSON definition of a preset or saved sound.',
      inputSchema: NAME_INPUT,
      annotations: { readOnlyHint: true },
      execute(input) {
        const name = readString(readInput(input), 'name')
        if (name === undefined) {
          return { error: MISSING_NAME }
        }
        const definition = findSound(name)
        return definition ? { name, definition } : { error: `No sound named "${name}".` }
      },
    })

    register({
      name: 'play_sound_preset',
      description: 'Plays a preset or saved sound aloud in this tab.',
      inputSchema: NAME_INPUT,
      async execute(input) {
        const name = readString(readInput(input), 'name')
        if (name === undefined) {
          return { success: false, error: MISSING_NAME }
        }
        const definition = findSound(name)
        if (!definition) {
          return { success: false, error: `No sound named "${name}".` }
        }
        // Presets and saved sounds are already registered under their names
        await playback.play(name)
        return { success: true, message: `Played "${name}".` }
      },
    })

    register({
      name: 'synthesize_sound',
      description: 'Synthesizes and auditions a tone from explicit oscillator parameters.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Identifier for the new sound.' },
          waveType: { type: 'string', enum: ['sine', 'square', 'sawtooth', 'triangle'] },
          frequency: { type: 'number', description: 'Pitch in Hz, e.g. 440 for A4.' },
          duration: { type: 'number', description: 'Seconds, 0.01 to 2.5.' },
          attack: { type: 'number', description: 'Rise time in seconds.' },
          decay: { type: 'number', description: 'Release tail in seconds.' },
          gain: { type: 'number', description: 'Level from 0.01 to 1.' },
          saveToLibrary: { type: 'boolean', description: 'Keep it in the saved library; a taken name gets a _copy suffix.' },
        },
        required: ['name', 'frequency', 'duration'],
      },
      async execute(rawInput) {
        // Remaining fields are checked by validateSoundDefinition
        const input = readInput(rawInput) as {
          name?: unknown
          waveType?: WaveType
          frequency: number
          duration: number
          attack?: number
          decay?: number
          gain?: number
          saveToLibrary?: boolean
        }
        if (typeof input.name !== 'string') {
          return { success: false, error: MISSING_NAME }
        }
        if (!isValidSoundName(input.name)) {
          return { success: false, error: `Invalid name "${input.name}". ${SOUND_NAME_RULE}` }
        }
        const definition: SoundDefinition = {
          waveType: input.waveType ?? 'sine',
          frequency: input.frequency,
          duration: input.duration,
          attack: input.attack ?? 0.01,
          decay: input.decay ?? 0.1,
          gain: input.gain ?? 0.4,
        }
        const errors = validateSoundDefinition(definition)
        if (errors.length > 0) {
          return { success: false, error: errors.join(' ') }
        }
        const savedAs = input.saveToLibrary === true ? library.saveAsNew(input.name, definition) : null
        const name = savedAs ?? toCustomSoundName(input.name)
        await (savedAs ? playback.play(savedAs) : playback.audition(name, definition))
        return { success: true, name, definition, saved: savedAs !== null }
      },
    })

    register({
      name: 'generate_ai_sound',
      description: 'Designs a sound from a plain-language description and auditions it.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'What the sound should be, e.g. "crystal bell chime".',
          },
          saveToLibrary: { type: 'boolean', description: 'Keep it in the saved library; a taken name gets a _copy suffix.' },
        },
        required: ['prompt'],
      },
      async execute(input) {
        const fields = readInput(input)
        const prompt = readString(fields, 'prompt')
        if (!prompt?.trim()) {
          return { success: false, error: 'Missing "prompt": describe the sound to design.' }
        }
        return reportResult(() => ai.generate(prompt, { saveToLibrary: fields.saveToLibrary === true }))
      },
    })

    register({
      name: 'edit_sound_definition',
      description: 'Rewrites a sound from a plain-language instruction, e.g. "an octave lower and punchier".',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Sound to edit, looked up if no definition is given.' },
          definition: { type: 'object', description: 'Definition to edit instead of looking one up.' },
          instruction: { type: 'string', description: 'The change to make.' },
          saveToLibrary: { type: 'boolean', description: 'Keep the result in the saved library; a taken name gets a _copy suffix.' },
        },
        required: ['name', 'instruction'],
      },
      async execute(input) {
        const fields = readInput(input)
        const name = readString(fields, 'name')
        const instruction = readString(fields, 'instruction')
        if (name === undefined) {
          return { success: false, error: 'Missing "name": the sound to edit.' }
        }
        if (!instruction?.trim()) {
          return { success: false, error: 'Missing "instruction": the change to make.' }
        }
        const definition = fields.definition as SoundDefinition | null | undefined
        const errors = definition == null ? [] : validateSoundDefinition(definition)
        if (errors.length > 0) {
          return { success: false, error: errors.join(' ') }
        }
        const target = definition ?? findSound(name)
        if (!target) {
          return { success: false, error: `No sound named "${name}", and no definition was given.` }
        }
        return reportResult(() =>
          ai.edit(target, name, instruction, { saveToLibrary: fields.saveToLibrary === true }))
      },
    })

    register({
      name: 'get_studio_state',
      description: 'Reports the current view, master level, and library sizes.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { readOnlyHint: true },
      execute: () => ({
        activeView: ui.activeView,
        masterVolume: playback.masterVolume,
        isMuted: playback.isMuted,
        activeVoices: playback.activeVoices,
        outputLevel: playback.outputLevel,
        presetCount: Object.keys(library.presets).length,
        customSoundCount: library.customSoundCount,
        aiModel: ai.promptApi.availability,
      }),
    })

    return () => controller.abort()
  }
  catch (error) {
    console.warn('Failed to register WebMCP tools:', error)
    controller.abort()
    return null
  }
}

// Agents may omit arguments or send the wrong types; schema is advisory, not enforced
function readInput(input: unknown): Record<string, unknown> {
  return typeof input === 'object' && input !== null ? input as Record<string, unknown> : {}
}

function readString(fields: Record<string, unknown>, key: string): string | undefined {
  const value = fields[key]
  return typeof value === 'string' ? value : undefined
}

// WebMCP tools return errors as structured data rather than throwing
async function reportResult(run: () => Promise<{
  name: string
  description: string
  definition: SoundDefinition
  source: string
}>) {
  try {
    const { name, description, definition, source } = await run()
    return { success: true, name, description, definition, source }
  }
  catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Sound generation failed.' }
  }
}

// Agent-supplied names must not resolve to inherited members such as "constructor"
function ownEntry(sounds: Record<string, SoundDefinition>, name: string): SoundDefinition | undefined {
  return Object.hasOwn(sounds, name) ? sounds[name] : undefined
}

function resolveModelContext(): ModelContext | null {
  const context = (document as { modelContext?: ModelContext }).modelContext
    ?? (navigator as { modelContext?: ModelContext }).modelContext
  return typeof context?.registerTool === 'function' ? context : null
}
