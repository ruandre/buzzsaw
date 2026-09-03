import type { StudioView } from './views'
import { describe, expect, it } from 'vitest'
import { STUDIO_VIEWS, viewBadge } from './views'

function view(overrides: Partial<StudioView> = {}): StudioView {
  return {
    id: 'browser',
    path: '/',
    label: 'Presets',
    icon: 'i-ph-stack-bold',
    ...overrides,
  }
}

describe('viewBadge', () => {
  it('returns static badge text', () => {
    expect(viewBadge(view({ badge: 'New' }))).toBe('New')
  })

  it('shows nothing for a view without a badge', () => {
    expect(viewBadge(view())).toBeUndefined()
  })
})

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
