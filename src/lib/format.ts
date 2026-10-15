import type { EventSummary } from '../types'

const IST = 'Asia/Kolkata'

/** Parse a YYYY-MM-DD (+ optional HH:MM) as an IST wall-clock instant. */
export function istDate(date: string, time = '00:00'): Date {
  return new Date(`${date}T${time}:00+05:30`)
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  return new Intl.DateTimeFormat('en-IN', { timeZone: IST, ...opts }).format(istDate(date))
}

export function formatWeekday(date: string) {
  return formatDate(date, { weekday: 'short' })
}

/** "18:00" -> "6:00 pm" */
export function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

export function formatDateRange(e: Pick<EventSummary, 'schedule_summary'>) {
  const { start_date, end_date, start_time, end_time } = e.schedule_summary
  if (start_date === end_date) {
    return `${formatDate(start_date)} · ${formatTime(start_time)} to ${formatTime(end_time)}`
  }
  return `${formatDate(start_date)} to ${formatDate(end_date)}`
}

export function formatDeadline(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

/** "14 Oct, 3:20 pm" for any timestamp, in IST. */
export function formatStamp(ms: number) {
  return formatDeadline(new Date(ms).toISOString())
}

export function daysUntil(iso: string, now = Date.now()) {
  return Math.ceil((new Date(iso).getTime() - now) / 86_400_000)
}

export interface Duration {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function splitDuration(ms: number): Duration {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

/** "2026-11" for grouping events by month. */
export function monthKey(date: string) {
  return date.slice(0, 7)
}

export function formatMonth(key: string) {
  return new Intl.DateTimeFormat('en-IN', { timeZone: IST, month: 'long', year: 'numeric' }).format(
    istDate(`${key}-01`),
  )
}

export function formatPrice(e: Pick<EventSummary, 'price' | 'is_per_head'>) {
  if (e.price === 0) return 'Free'
  return `${formatInr(e.price)}${e.is_per_head ? ' / person' : ' / team'}`
}

export function formatTeam(e: Pick<EventSummary, 'min_teamsize' | 'max_teamsize'>) {
  if (e.max_teamsize <= 1) return 'Solo'
  if (e.min_teamsize <= 1) return `Solo or teams up to ${e.max_teamsize}`
  if (e.min_teamsize === e.max_teamsize) return `Teams of ${e.max_teamsize}`
  return `Teams of ${e.min_teamsize} to ${e.max_teamsize}`
}

export function seatsLeft(e: Pick<EventSummary, 'total_seats' | 'seats_filled'>) {
  return Math.max(0, e.total_seats - e.seats_filled)
}

export function fillRatio(e: Pick<EventSummary, 'total_seats' | 'seats_filled'>) {
  return e.total_seats === 0 ? 0 : Math.min(1, e.seats_filled / e.total_seats)
}

export function formatInr(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

/** Can a visitor still register? */
export function isRegistrable(e: Pick<EventSummary, 'registration_status' | 'event_status'>) {
  return e.registration_status === 'OPEN' && e.event_status === 'ACTIVE'
}
