import { describe, expect, it } from 'vitest'
import { normalizeSoundPatch } from './patch'
import {
  buildDesignPrompt,
  buildEditPrompt,
  SOUND_DESIGNER_SYSTEM_PROMPT,
  SOUND_EDITOR_SYSTEM_PROMPT,
  SOUND_PATCH_SCHEMA,
} from './prompts'

describe('prompts', () => {
  describe('sound designer prompt', () => {
    it('contains structural markdown delimiters', () => {
      expect(SOUND_DESIGNER_SYSTEM_PROMPT).toContain('## Instructions')
      expect(SOUND_DESIGNER_SYSTEM_PROMPT).toContain('## Synthesis Parameters')
      expect(SOUND_DESIGNER_SYSTEM_PROMPT).toContain('## Critical Timing Rules')
      expect(SOUND_DESIGNER_SYSTEM_PROMPT).toContain('## Few-Shot Examples')
    })

    it('instructs model to use description as design plan', () => {
      expect(SOUND_DESIGNER_SYSTEM_PROMPT).toContain('"description" field')
    })

    it('warns about gain.steps usage', () => {
      expect(SOUND_DESIGNER_SYSTEM_PROMPT).toContain('gain.steps MUST be []')
    })

    it('instructs the model to derive parameters instead of copying examples', () => {
      expect(SOUND_DESIGNER_SYSTEM_PROMPT).toContain('## Derivation Procedure')
      expect(SOUND_DESIGNER_SYSTEM_PROMPT).toContain('never copy an example\'s numbers')
    })

    it('offers custom partials so timbre is not limited to four waves', () => {
      expect(SOUND_DESIGNER_SYSTEM_PROMPT).toContain('custom: partials')
      expect(SOUND_DESIGNER_SYSTEM_PROMPT).toMatch(/"waveType":"custom","partials":\[1,/)
    })

    it('all few-shot design examples are valid SoundPatch objects', () => {
      const jsonMatches = SOUND_DESIGNER_SYSTEM_PROMPT.matchAll(/\{"description":[\s\S]*?\}(?=\n|$)/g)
      const examples = Array.from(jsonMatches, m => m[0])

      expect(examples.length).toBeGreaterThanOrEqual(4)

      for (const example of examples) {
        expect(() => {
          const parsed = JSON.parse(example)
          const patch = normalizeSoundPatch(parsed)
          expect(patch.name).toBeTruthy()
          expect(patch.definition.duration).toBeGreaterThan(0)
        }).not.toThrow()
      }
    })
  })

  describe('sound editor prompt', () => {
    it('contains structural markdown delimiters', () => {
      expect(SOUND_EDITOR_SYSTEM_PROMPT).toContain('## Instructions')
      expect(SOUND_EDITOR_SYSTEM_PROMPT).toContain('## Edit Rules')
      expect(SOUND_EDITOR_SYSTEM_PROMPT).toContain('## Few-Shot Examples')
    })

    it('all few-shot edit examples are valid SoundPatch objects', () => {
      const jsonMatches = SOUND_EDITOR_SYSTEM_PROMPT.matchAll(/\{"description":[\s\S]*?\}(?=\n|$)/g)
      const examples = Array.from(jsonMatches, m => m[0])

      expect(examples.length).toBeGreaterThanOrEqual(4)

      for (const example of examples) {
        expect(() => {
          const parsed = JSON.parse(example)
          const patch = normalizeSoundPatch(parsed)
          expect(patch.name).toBeTruthy()
          expect(patch.definition.duration).toBeGreaterThan(0)
        }).not.toThrow()
      }
    })
  })

  describe('sound patch schema', () => {
    it('requires all key sound patch parameters', () => {
      expect(SOUND_PATCH_SCHEMA.required).toEqual([
        'description',
        'waveType',
        'partials',
        'frequency',
        'gain',
        'duration',
        'attack',
        'decay',
        'name',
      ])
    })

    it('generates the design plan before the patch name', () => {
      const order = Object.keys(SOUND_PATCH_SCHEMA.properties)

      expect(order.indexOf('description')).toBeLessThan(order.indexOf('name'))
    })
  })

  describe('buildDesignPrompt', () => {
    it('formats prompt matching the few-shot example prefix', () => {
      expect(buildDesignPrompt('laser blast')).toBe('Task: Design a patch for: "laser blast"')
    })
  })

  describe('buildEditPrompt', () => {
    it('normalizes scalar frequency and gain into schema-compliant envelope objects', () => {
      const prompt = buildEditPrompt(
        'laser',
        JSON.stringify({ waveType: 'sawtooth', frequency: 1200, gain: 0.5, duration: 0.2 }),
        'make it lower',
      )

      expect(prompt).toContain('Current patch:')
      expect(prompt).toContain('"partials":[]')
      expect(prompt).toContain('"frequency":{"start":1200,"steps":[]}')
      expect(prompt).toContain('"gain":{"start":0.5,"steps":[]}')
      expect(prompt).toContain('Instruction: "make it lower"')
    })

    it('accepts raw object definition directly', () => {
      const prompt = buildEditPrompt(
        'bell',
        { waveType: 'sine', frequency: 880, gain: 0.3, duration: 0.5, attack: 0.01, decay: 0.4 },
        'octave up',
      )

      expect(prompt).toContain('"name":"bell"')
      expect(prompt).toContain('"partials":[]')
      expect(prompt).toContain('"frequency":{"start":880,"steps":[]}')
      expect(prompt).toContain('Instruction: "octave up"')
    })
  })
})
