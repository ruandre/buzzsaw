import { describe, expect, it } from 'vitest'
import { isSafeKey, safeRecordEntries, STORAGE_KEYS } from './storage'

describe('safeRecordEntries', () => {
  it('returns the entries of a plain record', () => {
    expect(safeRecordEntries({ a: 1, b: 2 })).toEqual([['a', 1], ['b', 2]])
  })

  it.each([null, undefined, 'text', 42, [1, 2]])('yields nothing for %s', (raw) => {
    expect(safeRecordEntries(raw)).toEqual([])
  })

  it('drops keys that would reach the prototype chain', () => {
    const crafted = JSON.parse('{"__proto__": {"polluted": true}, "constructor": 1, "ok": 2}')

    expect(safeRecordEntries(crafted)).toEqual([['ok', 2]])
  })
})

describe('isSafeKey', () => {
  it.each(['__proto__', 'constructor', 'prototype'])('rejects %s', (key) => {
    expect(isSafeKey(key)).toBe(false)
  })

  it('accepts an ordinary sound name', () => {
    expect(isSafeKey('laserShot')).toBe(true)
  })
})

describe('sTORAGE_KEYS', () => {
  // Verifies all studio keys are namespaced for complete purge
  it('namespaces every key and keeps them distinct', () => {
    const keys = Object.values(STORAGE_KEYS)

    expect(keys.every(key => key.startsWith('buzzsaw_studio_'))).toBe(true)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
