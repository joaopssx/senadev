import { onLocaleChange, t } from '../../i18n'
import { calculateAge, todayInSaoPaulo, type Age, type CalendarDate } from '../../lib/age'

const BIRTH_DATE: CalendarDate = { year: 2005, month: 12, day: 11 }
const REFRESH_MS = 1000

function formatAge({ years, months, days }: Age): string {
  return [
    `${years} ${t(years === 1 ? 'age.year' : 'age.years')}`,
    `${months} ${t(months === 1 ? 'age.month' : 'age.months')}`,
    `${days} ${t(days === 1 ? 'age.day' : 'age.days')}`,
  ].join(', ')
}

function setText(element: Element | null, text: string): void {
  if (element && element.textContent !== text) element.textContent = text
}

function renderAge(): void {
  const age = calculateAge(BIRTH_DATE, todayInSaoPaulo(new Date()))
  setText(document.querySelector('.about__age'), formatAge(age))
  setText(document.querySelector('.about__text'), t('about.text').replace('{age}', `${age.years}`))
}

export function initAbout(): void {
  renderAge()
  onLocaleChange(renderAge)
  setInterval(renderAge, REFRESH_MS)
}
