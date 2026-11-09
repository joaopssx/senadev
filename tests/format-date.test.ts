import { describe, expect, it } from 'vitest'
import { formatGuestbookDate } from '../src/lib/format-date'

describe('formatGuestbookDate', () => {
  it.each([
    ['2026-11-09T15:12:45Z', '[09/11/2026] - [12:12:45]'],
    ['2026-01-01T02:59:59Z', '[31/12/2025] - [23:59:59]'],
    ['2026-01-01T03:00:00Z', '[01/01/2026] - [00:00:00]'],
  ])('formats %s in the Sao Paulo time zone', (input, expected) => {
    expect(formatGuestbookDate(input)).toBe(expected)
  })
})
