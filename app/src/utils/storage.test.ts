import { describe, expect, it } from 'vitest'
import { isSafeKey, safeRecordEntries, STORAGE_KEYS } from './storage'

describe('safeRecordEntries', () => {
  it('returns the entries of a plain record', () => {
    expect(safeRecordEntries({ a: 1, b: 2 })).toEqual([['a', 1], ['b', 2]])
  })

  it.each([null, undefined, 'text', 42, [1, 2]])('yields nothing for %s', (raw) => {
    expect(safeRecordEntries(raw)).toEqual([])
  })

  it('drops a key that would replace the prototype', () => {
    const crafted = JSON.parse('{"__proto__": {"polluted": true}, "ok": 2}')

    expect(safeRecordEntries(crafted)).toEqual([['ok', 2]])
  })

  it('keeps own keys that only shadow prototype members', () => {
    const raw = JSON.parse('{"constructor": 1, "prototype": 2}')

    expect(safeRecordEntries(raw)).toEqual([['constructor', 1], ['prototype', 2]])
  })
})

describe('isSafeKey', () => {
  it('rejects __proto__', () => {
    expect(isSafeKey('__proto__')).toBe(false)
  })

  it.each(['laserShot', 'constructor', 'prototype'])('accepts %s', (key) => {
    expect(isSafeKey(key)).toBe(true)
  })
})

describe('sTORAGE_KEYS', () => {
  it('namespaces every key and keeps them distinct', () => {
    const keys = Object.values(STORAGE_KEYS)

    expect(keys.every(key => key.startsWith('buzzsaw_studio_'))).toBe(true)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
