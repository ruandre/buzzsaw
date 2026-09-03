import type { SoundDefinition } from '@rjvr/buzzsaw'
import type { SoundPatch } from '../patch'
import { cloneSoundDefinition } from '@rjvr/buzzsaw'
import { describeDescriptorPatch, synthesizeFromDescriptors } from './descriptors'
import { findRecipe } from './recipes'
import { applyTransforms } from './transforms'

export { SOUND_RECIPES } from './recipes'
export { TRANSFORM_GROUPS } from './transforms'

export function designHeuristicPatch(prompt: string): SoundPatch {
  const normalized = prompt.toLowerCase()
  const recipe = findRecipe(normalized)

  if (recipe) {
    return {
      name: recipe.name,
      description: recipe.description,
      definition: cloneSoundDefinition(recipe.definition),
    }
  }

  const definition = synthesizeFromDescriptors(normalized)
  return {
    name: `synth_${definition.waveType}_${Math.floor(Math.random() * 1000)}`,
    description: describeDescriptorPatch(definition, prompt),
    definition,
  }
}

export function editHeuristicPatch(
  original: SoundDefinition,
  originalName: string,
  instruction: string,
): SoundPatch {
  const definition = cloneSoundDefinition(original)
  const applied = applyTransforms(definition, instruction.toLowerCase())
  const summary = applied.length > 0 ? applied.join(', ') : 'fine-tuned parameters'

  return {
    name: `${originalName.replace(/_mod.*$/, '')}_mod`,
    description: `Edited "${originalName}": applied ${summary}.`,
    definition,
  }
}
