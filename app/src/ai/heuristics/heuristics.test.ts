import type { SoundDefinition } from '@rjvr/buzzsaw'
import { DEFAULT_DURATION_S, round, validateSoundDefinition } from '@rjvr/buzzsaw'
import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'
import { describe, expect, it } from 'vitest'
import { designHeuristicPatch, editHeuristicPatch, SOUND_RECIPES, TRANSFORM_GROUPS } from '.'
import { MIN_PITCH_HZ } from '../../audio/pitches'
import { QUICK_TRANSFORMS } from '../presets'
import { findRecipe } from './recipes'
import { applyTransforms } from './transforms'

describe('designHeuristicPatch', () => {
  it('returns a copy of the matching recipe', () => {
    const patch = designHeuristicPatch('Futuristic LASER blaster')
    const recipe = SOUND_RECIPES.find(candidate => candidate.name === 'laserBlaster')

    expect(patch.name).toBe('laserBlaster')
    expect(patch.definition).toEqual(recipe?.definition)
    expect(patch.definition).not.toBe(recipe?.definition)
  })

  it('shapes a sine at A4 from a prompt no recipe or descriptor knows', () => {
    const patch = designHeuristicPatch('something unusual')

    expect(patch.definition).toMatchObject({ waveType: 'sine', frequency: 440, duration: 0.3 })
    expect(patch.name).toMatch(/^synth_sine_\d+$/)
    expect(patch.description).toContain('"something unusual"')
  })

  it('combines timbre, register, envelope and pitch motion descriptors', () => {
    const patch = designHeuristicPatch('a bright, short, rising tone')

    expect(patch.definition).toMatchObject({ waveType: 'sawtooth', duration: 0.09 })
    expect(patch.definition.frequency).toEqual({ start: 1200, steps: [{ value: 2400, time: expect.closeTo(0.063, 3) }] })
  })

  it('yields a valid definition for every recipe', () => {
    for (const recipe of SOUND_RECIPES) {
      expect(validateSoundDefinition(recipe.definition), recipe.name).toEqual([])
    }
  })
})

describe('findRecipe', () => {
  it('lets a vetoed keyword fall through to a later recipe', () => {
    expect(findRecipe('8-bit explosion')?.name).toBe('arcadeExplosion')
  })

  it('does not let "win" capture wind chimes or twinkles', () => {
    expect(findRecipe('wind chime')?.name).toBe('crystalBellChime')
    expect(findRecipe('twinkle sparkle')?.name).toBe('magicSparkle')
    expect(findRecipe('you win fanfare')?.name).toBe('powerLevelUp')
  })
})

describe('editHeuristicPatch', () => {
  it('suffixes the name once however many times a sound is edited', () => {
    const first = editHeuristicPatch({ frequency: 440 }, 'blip', 'louder')
    const second = editHeuristicPatch(first.definition, first.name, 'softer')

    expect(first.name).toBe('blip_mod')
    expect(second.name).toBe('blip_mod')
  })

  it('reports fine-tuning when no transform matches', () => {
    const patch = editHeuristicPatch({ frequency: 440 }, 'blip', 'make it nicer')

    expect(patch.description).toContain('fine-tuned parameters')
    expect(patch.definition).toEqual({ frequency: 440, waveType: undefined, partials: undefined, gain: undefined, duration: undefined, attack: undefined, decay: undefined })
  })

  it('leaves the original definition untouched', () => {
    const original = { frequency: 440, gain: 0.5 }

    editHeuristicPatch(original, 'blip', 'octave up louder')

    expect(original).toEqual({ frequency: 440, gain: 0.5 })
  })
})

describe('applyTransforms', () => {
  it('applies at most one transform per group, in group order', () => {
    const definition = { frequency: 440, gain: 0.5, duration: 0.3 }

    const applied = applyTransforms(definition, 'square sine octave up louder softer')

    expect(applied).toEqual(['square 8-bit timbre', 'pitched up an octave', 'boosted level'])
    expect(definition).toMatchObject({ waveType: 'square', frequency: 880, gain: 0.7 })
  })

  it('shortens a sound from the duration the library plays it at when none is set', () => {
    const definition: SoundDefinition = { frequency: 440 }

    applyTransforms(definition, 'shorter')

    expect(definition.duration).toBe(round(DEFAULT_DURATION_S * 0.55, 3))
  })

  it('floors a lowered pitch at the studio minimum', () => {
    const definition = { frequency: MIN_PITCH_HZ + 1 }

    applyTransforms(definition, 'octave down')

    expect(definition.frequency).toBe(MIN_PITCH_HZ)
  })

  it('scales every step of a frequency envelope', () => {
    const definition = { frequency: { start: 440, steps: [{ value: 880, time: 0.1 }] } }

    applyTransforms(definition, 'octave down')

    expect(definition.frequency).toEqual({ start: 220, steps: [{ value: 440, time: 0.1 }] })
  })

  it('leaves an envelope gain alone when asked to change the level', () => {
    const gain = { start: 0.2, steps: [{ value: 0.5, time: 0.1 }] }
    const definition = { frequency: 440, gain }

    expect(applyTransforms(definition, 'louder')).toEqual(['boosted level'])
    expect(definition.gain).toBe(gain)
  })

  it.each([
    ['Snappier', ['snappier transient']],
    ['Octave down', ['pitched down an octave']],
    ['Octave up', ['pitched up an octave']],
    ['Arpeggio', ['ascending arpeggio']],
    ['8-bit', ['square 8-bit timbre']],
    ['Long tail', ['extended resonant tail']],
    ['Pulsing', ['pulsing gain envelope']],
    ['Pitch dive', ['pitch dive']],
  ])('applies exactly what the "%s" quick transform promises', (label, expected) => {
    const transform = QUICK_TRANSFORMS.find(candidate => candidate.label === label)

    expect(applyTransforms({ frequency: 440 }, transform?.prompt.toLowerCase() ?? '')).toEqual(expected)
  })

  it('offers no quick transform without a test of what it applies', () => {
    expect(QUICK_TRANSFORMS.map(transform => transform.label)).toEqual([
      'Snappier',
      'Octave down',
      'Octave up',
      'Arpeggio',
      '8-bit',
      'Long tail',
      'Pulsing',
      'Pitch dive',
    ])
  })

  it.each([
    ['make it slower', 'lowered pitch'],
    ['more subtle', 'lowered pitch'],
    ['a sawing motion', 'sawtooth harmonics'],
  ])('does not let "%s" trigger %s through a keyword inside a longer word', (instruction, summary) => {
    expect(applyTransforms({ frequency: 440 }, instruction)).not.toContain(summary)
  })

  it.each([
    ['make it deeper', 'lowered pitch'],
    ['a wobbly tone', 'vibrato oscillation'],
    ['pulsing please', 'pulsing gain envelope'],
  ])('still reads the inflection in "%s" as %s', (instruction, summary) => {
    expect(applyTransforms({ frequency: 440 }, instruction)).toContain(summary)
  })

  it('matches a keyword at a hyphen or punctuation boundary', () => {
    expect(applyTransforms({ frequency: 440 }, 'sub-bass, please')).toEqual(['lowered pitch'])
  })

  it('keeps every preset valid under every transform keyword', () => {
    const keywords = TRANSFORM_GROUPS.flat().flatMap(transform => transform.keywords)

    for (const [name, preset] of Object.entries(DEFAULT_SOUNDS)) {
      for (const keyword of keywords) {
        const edited = editHeuristicPatch(preset, name, keyword)
        expect(validateSoundDefinition(edited.definition), `${name} + "${keyword}"`).toEqual([])
      }
    }
  })
})
