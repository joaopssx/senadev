import { describe, expect, it } from 'vitest'
import { en } from '../src/i18n/en'
import { pt } from '../src/i18n/pt'

describe('i18n dictionaries', () => {
  it('have the same keys', () => {
    expect(Object.keys(pt).sort()).toEqual(Object.keys(en).sort())
  })

  it('have no empty values', () => {
    for (const value of [...Object.values(en), ...Object.values(pt)]) {
      expect(value.trim()).not.toBe('')
    }
  })
})
