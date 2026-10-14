import type { EventSummary } from '../../types'
import { istDate } from '../../lib/format'
import { registrationState } from '../ui/StatusBadge'

/** Build IST Date from a ScheduleSummary start. */
export function eventStartDate(e: EventSummary): Date {
  return istDate(e.schedule_summary.start_date, e.schedule_summary.start_time)
}

/** Days from now to target Date (ceil, min 0). */
export function daysFromNow(target: Date, now = Date.now()): number {
  return Math.max(0, Math.ceil((target.getTime() - now) / 86_400_000))
}

/** True when the event starts in the future (IST wall-clock). */
export function startsInFuture(e: EventSummary, now = Date.now()): boolean {
  return eventStartDate(e).getTime() > now
}

export interface HeroStatsData {
  total: number | null
  open: number | null
  free: number | null
  nextEvent: { name: string; startsAt: string } | null
}

/**
 * Compute HeroStats from the loaded events array.
 * Returns all-null when events === null (loading / error).
 */
export function computeHeroStats(events: EventSummary[] | null): HeroStatsData {
  if (!events) return { total: null, open: null, free: null, nextEvent: null }

  const now = Date.now()
  const total = events.length
  const open = events.filter((e) => registrationState(e).registrable).length
  const free = events.filter((e) => e.price === 0).length

  const nextCandidates = events
    .filter((e) => e.event_status === 'ACTIVE' && startsInFuture(e, now))
    .sort((a, b) => eventStartDate(a).getTime() - eventStartDate(b).getTime())

  const next = nextCandidates[0] ?? null
  const nextEvent = next
    ? {
        name: next.name,
        // ISO with +05:30 per spec
        startsAt: `${next.schedule_summary.start_date}T${next.schedule_summary.start_time}:00+05:30`,
      }
    : null

  return { total, open, free, nextEvent }
}

/** Days until the next event (for the signal strip "days" stat). */
export function daysToNext(events: EventSummary[] | null): number | null {
  if (!events) return null
  const now = Date.now()
  const next = events
    .filter((e) => e.event_status === 'ACTIVE' && startsInFuture(e, now))
    .sort((a, b) => eventStartDate(a).getTime() - eventStartDate(b).getTime())[0]
  return next ? daysFromNow(eventStartDate(next)) : null
}
