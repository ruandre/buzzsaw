import { describe, expect, it } from 'vitest'
import { countByCategory, getSoundCategory, SOUND_CATEGORIES } from './categories'

describe('getSoundCategory', () => {
  it.each([
    ['softClick', 'ui'],
    ['notificationDing', 'notifications'],
    ['redAlert', 'alerts'],
    ['laserShot', 'scifi'],
    ['coinPickup', 'game'],
    ['minorChord', 'music'],
  ])('files %s under %s', (name, category) => {
    expect(getSoundCategory(name)).toBe(category)
  })

  it('is case insensitive', () => {
    expect(getSoundCategory('LASERShot')).toBe('scifi')
  })

  it('falls back to tones when no keyword matches', () => {
    expect(getSoundCategory('zzzz')).toBe('tones')
  })

  it('resolves an ambiguous name to the earliest matching category', () => {
    // Earlier category in registry takes precedence
    expect(getSoundCategory('clickAlarm')).toBe('ui')
  })
})

describe('countByCategory', () => {
  it('totals every category plus the two virtual ones', () => {
    const counts = countByCategory(['softClick', 'laserShot', 'zzzz'], 2)

    expect(counts.all).toBe(3)
    expect(counts.favorites).toBe(2)
    expect(counts.ui).toBe(1)
    expect(counts.scifi).toBe(1)
    expect(counts.tones).toBe(1)
  })

  it('seeds every known category at zero rather than leaving it undefined', () => {
    const counts = countByCategory([], 0)

    for (const category of SOUND_CATEGORIES) {
      expect(counts[category]).toBe(0)
    }
  })
})
