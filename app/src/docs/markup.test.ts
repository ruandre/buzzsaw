import { describe, expect, it } from 'vitest'
import { parseProse } from './markup'

describe('parseProse', () => {
  it('returns plain text as a single segment', () => {
    expect(parseProse('A sound is data.')).toEqual([
      { text: 'A sound is data.', isCode: false },
    ])
  })

  it('splits backticked spans out as code', () => {
    expect(parseProse('Call `play()` first.')).toEqual([
      { text: 'Call ', isCode: false },
      { text: 'play()', isCode: true },
      { text: ' first.', isCode: false },
    ])
  })

  it('handles adjacent and trailing code spans', () => {
    expect(parseProse('`a``b`')).toEqual([
      { text: 'a', isCode: true },
      { text: 'b', isCode: true },
    ])
  })

  it('leaves an unclosed backtick as prose', () => {
    expect(parseProse('half `open')).toEqual([
      { text: 'half `open', isCode: false },
    ])
  })

  it('returns nothing for an empty string', () => {
    expect(parseProse('')).toEqual([])
  })
})
