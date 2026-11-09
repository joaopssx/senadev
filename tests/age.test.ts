import { describe, expect, it } from 'vitest'
import { calculateAge, todayInSaoPaulo, type CalendarDate } from '../src/lib/age'

function date(day: number, month: number, year: number): CalendarDate {
  return { year, month, day }
}

function age(years: number, months: number, days: number) {
  return { years, months, days }
}

describe('calculateAge', () => {
  const birth = date(11, 12, 2005)

  it.each([
    [date(9, 11, 2026), age(20, 10, 29)],
    [date(10, 12, 2026), age(20, 11, 29)],
    [date(11, 12, 2026), age(21, 0, 0)],
    [date(12, 12, 2026), age(21, 0, 1)],
    [date(11, 12, 2005), age(0, 0, 0)],
  ])('counts from the real birth date to %o', (today, expected) => {
    expect(calculateAge(birth, today)).toEqual(expected)
  })

  it.each([
    [date(31, 1, 2025), date(28, 2, 2025), age(0, 1, 0)],
    [date(31, 1, 2025), date(1, 3, 2025), age(0, 1, 1)],
    [date(31, 1, 2025), date(31, 3, 2025), age(0, 2, 0)],
    [date(30, 1, 2024), date(1, 3, 2024), age(0, 1, 1)],
    [date(31, 8, 2025), date(30, 9, 2025), age(0, 1, 0)],
  ])('handles month ends from %o to %o', (from, to, expected) => {
    expect(calculateAge(from, to)).toEqual(expected)
  })

  it.each([
    [date(28, 2, 2025), age(1, 0, 0)],
    [date(1, 3, 2025), age(1, 0, 1)],
    [date(29, 2, 2028), age(4, 0, 0)],
  ])('handles a 29 February birth on %o', (today, expected) => {
    expect(calculateAge(date(29, 2, 2024), today)).toEqual(expected)
  })
})

describe('todayInSaoPaulo', () => {
  it('uses the Sao Paulo calendar day, not the UTC one', () => {
    expect(todayInSaoPaulo(new Date('2026-12-11T02:59:59Z'))).toEqual(date(10, 12, 2026))
    expect(todayInSaoPaulo(new Date('2026-12-11T03:00:00Z'))).toEqual(date(11, 12, 2026))
  })
})
