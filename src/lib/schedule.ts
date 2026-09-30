const zone = 'Europe/Moscow'

function localParts(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now)
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute') }
}

export function formatKrasnodarDate(offsetDays: number, now = new Date()) {
  const { year, month, day } = localParts(now)
  // Noon UTC remains on the same calendar day in Krasnodar.
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays, 12))
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: zone }).format(date)
}

export function bookingDateOptions(now = new Date()) {
  return ['Сегодня', 'Завтра', formatKrasnodarDate(2, now)]
}

export function cakeDateOptions(now = new Date()) {
  return [formatKrasnodarDate(3, now), formatKrasnodarDate(4, now)]
}

export function isFutureBookingTime(date: string, time: string, now = new Date()) {
  const offset = bookingDateOptions(now).indexOf(date)
  if (offset < 0) return false
  if (offset > 0) return true
  const [hour, minute] = time.split(':').map(Number)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return false
  const local = localParts(now)
  return hour * 60 + minute > local.hour * 60 + local.minute
}

export function upcomingOrderIntervals(now = new Date()) {
  const { hour, minute } = localParts(now)
  const first = Math.ceil((hour * 60 + minute + 60) / 30) * 30
  const label = (start: number) => {
    const clock = (minutes: number) => `${String(Math.floor((minutes % 1440) / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
    return `${start >= 1440 ? 'Завтра' : 'Сегодня'}, ${clock(start)}–${clock(start + 30)}`
  }
  return [label(first), label(first + 30)]
}
