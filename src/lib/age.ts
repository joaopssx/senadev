export interface CalendarDate {
  year: number
  month: number
  day: number
}

export interface Age {
  years: number
  months: number
  days: number
}

const MONTHS_PER_YEAR = 12
const MS_PER_DAY = 86_400_000

const saoPauloDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
})

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function toUtc(date: CalendarDate): number {
  return Date.UTC(date.year, date.month - 1, date.day)
}

// A day that doesn't exist in the target month lands on its last day, so someone
// born on 29 February turns a year older on 28 February in common years.
function addMonths(date: CalendarDate, months: number): CalendarDate {
  const monthIndex = date.year * MONTHS_PER_YEAR + date.month - 1 + months
  const year = Math.floor(monthIndex / MONTHS_PER_YEAR)
  const month = (monthIndex % MONTHS_PER_YEAR) + 1
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) }
}

export function calculateAge(birth: CalendarDate, today: CalendarDate): Age {
  let totalMonths = (today.year - birth.year) * MONTHS_PER_YEAR + today.month - birth.month
  if (toUtc(addMonths(birth, totalMonths)) > toUtc(today)) totalMonths -= 1

  return {
    years: Math.floor(totalMonths / MONTHS_PER_YEAR),
    months: totalMonths % MONTHS_PER_YEAR,
    days: (toUtc(today) - toUtc(addMonths(birth, totalMonths))) / MS_PER_DAY,
  }
}

export function todayInSaoPaulo(now: Date): CalendarDate {
  const parts = saoPauloDate.formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value)
  return { year: part('year'), month: part('month'), day: part('day') }
}
