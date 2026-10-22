import { describe, expect, it } from 'vitest'
import { toCustomSoundName } from '../audio/soundName'
import { DOC_EXAMPLES, DOC_TOPICS } from './content'

describe('documentation examples', () => {
  it.each(DOC_EXAMPLES.map(example => example.name))('plays %s without replacing a preset', (name) => {
    expect(toCustomSoundName(name)).toBe(name)
  })
})

describe('documentation prose', () => {
  const prose = DOC_TOPICS.flatMap(topic => topic.blocks.flatMap(block => (block.kind === 'prose' ? [block.text] : [])))

  it.each(prose)('uses no markdown emphasis, which the prose renderer shows as raw asterisks: %s', (text) => {
    expect(text).not.toMatch(/\*\S[^*]*\*/)
  })
})
