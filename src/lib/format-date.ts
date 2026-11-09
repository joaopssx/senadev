const saoPauloFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

export function formatGuestbookDate(isoDate: string): string {
  const parts = saoPauloFormat.formatToParts(new Date(isoDate))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''
  return `[${part('day')}/${part('month')}/${part('year')}] - [${part('hour')}:${part('minute')}:${part('second')}]`
}
