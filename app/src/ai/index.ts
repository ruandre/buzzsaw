import type { SoundDefinition } from '@rjvr/buzzsaw'
import type { SoundPatch } from './patch'
import type { PromptRunOptions } from './session'
import { designHeuristicPatch, editHeuristicPatch } from './heuristics'
import { parseSoundPatch } from './patch'
import {
  buildDesignPrompt,
  buildEditPrompt,
  SOUND_DESIGNER_SYSTEM_PROMPT,
  SOUND_EDITOR_SYSTEM_PROMPT,
  SOUND_PATCH_SCHEMA,
} from './prompts'
import { isAbortError, runStructuredPrompt } from './session'

export { checkPromptApiAvailability } from './availability'
export type { PromptApiAvailability, PromptApiStatus } from './availability'
export { designHeuristicPatch, editHeuristicPatch } from './heuristics'
export { normalizeSoundPatch, parseSoundPatch } from './patch'
export type { SoundPatch } from './patch'
export type { PromptRunOptions } from './session'

export type PatchSource = 'model' | 'offline'

export interface DesignedSound extends SoundPatch {
  source: PatchSource
  designedAt: number
}

/** Synthesizes sound from description; falls back to offline heuristics */
export async function designSound(
  description: string,
  options: PromptRunOptions = {},
): Promise<DesignedSound> {
  const prompt = description.trim()
  if (!prompt) {
    throw new Error('Describe the sound you want before generating.')
  }

  return runWithFallback(
    () => runStructuredPrompt({
      systemPrompt: SOUND_DESIGNER_SYSTEM_PROMPT,
      userPrompt: buildDesignPrompt(prompt),
      responseSchema: SOUND_PATCH_SCHEMA,
      sampling: 'creative',
      workingMessage: 'Designing the patch on-device...',
    }, options),
    () => designHeuristicPatch(prompt),
    options,
  )
}

/** Applies natural language edit to patch; falls back to offline heuristics */
export async function redesignSound(
  original: SoundDefinition,
  originalName: string,
  instruction: string,
  options: PromptRunOptions = {},
): Promise<DesignedSound> {
  const request = instruction.trim()
  if (!request) {
    throw new Error('Describe the change you want before editing.')
  }

  return runWithFallback(
    () => runStructuredPrompt({
      systemPrompt: SOUND_EDITOR_SYSTEM_PROMPT,
      userPrompt: buildEditPrompt(originalName, JSON.stringify(original), request),
      responseSchema: SOUND_PATCH_SCHEMA,
      sampling: 'precise',
      workingMessage: 'Reworking the patch on-device...',
    }, options),
    () => editHeuristicPatch(original, originalName, request),
    options,
  )
}

// Runs model prompt, falling back to offline generator while rethrowing aborts
async function runWithFallback(
  model: () => Promise<string | null>,
  offline: () => SoundPatch,
  options: PromptRunOptions,
): Promise<DesignedSound> {
  try {
    const output = await model()
    if (output !== null) {
      return { ...parseSoundPatch(output), source: 'model', designedAt: Date.now() }
    }
  }
  catch (error) {
    if (isAbortError(error, options.signal)) {
      throw error
    }
    console.warn('On-device model failed; using the offline synthesis engine:', error)
  }

  options.onProgress?.('Using the offline synthesis engine...')
  return { ...offline(), source: 'offline', designedAt: Date.now() }
}
