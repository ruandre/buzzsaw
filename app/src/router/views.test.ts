import { describe, expect, it } from 'vitest'
import { STUDIO_VIEWS } from './views'

describe('sTUDIO_VIEWS', () => {
  it('gives every view a unique id and path', () => {
    expect(new Set(STUDIO_VIEWS.map(v => v.id)).size).toBe(STUDIO_VIEWS.length)
    expect(new Set(STUDIO_VIEWS.map(v => v.path)).size).toBe(STUDIO_VIEWS.length)
  })

  // Number-key navigation shortcuts map 1:1 to views
  it('stays within the range the keyboard shortcuts cover', () => {
    expect(STUDIO_VIEWS.length).toBeLessThanOrEqual(9)
  })
})
