import { describe, expect, it } from 'vitest'
import { toCustomSoundName } from '../audio/soundName'
import { DOC_EXAMPLES, DOC_TOPICS, installCommand, PACKAGE_MANAGERS } from './content'

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

describe('install tabs', () => {
  it('lists package managers in tab order', () => {
    expect(PACKAGE_MANAGERS).toEqual(['npm', 'yarn', 'pnpm', 'bun', 'aube', 'nub'])
  })

  it('installs both packages with aube', () => {
    expect(installCommand('aube')).toBe('aube add @rjvr/buzzsaw @rjvr/buzzsaw-wav')
  })
})
