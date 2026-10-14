import type { EventSummary } from '../../types'
import { istDate, monthKey, formatMonth } from '../../lib/format'
import { registrationState } from '../ui/StatusBadge'
import type { HeroStats } from '../hero/Hero'

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

export type HeroStatsData = HeroStats

/**
 * Compute HeroStats from the loaded events array.
 * Returns all-null when events === null (loading / error).
 */
export function computeHeroStats(events: EventSummary[] | null, now = Date.now()): HeroStats {
  if (!events) return { total: null, open: null, free: null, nextEvent: null }

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
export function daysToNext(events: EventSummary[] | null, now = Date.now()): number | null {
  if (!events) return null
  const next = events
    .filter((e) => e.event_status === 'ACTIVE' && startsInFuture(e, now))
    .sort((a, b) => eventStartDate(a).getTime() - eventStartDate(b).getTime())[0]
  return next ? daysFromNow(eventStartDate(next), now) : null
}

/**
 * Get up to `limit` OPEN events with nearest registration deadlines.
 */
export function getClosingSoonEvents(
  events: EventSummary[] | null,
  limit = 6,
  now = Date.now(),
): EventSummary[] {
  if (!events) return []
  const openEvents = events.filter((e) => registrationState(e).registrable)
  const futureOpen = openEvents.filter((e) => new Date(e.registration_deadline).getTime() > now)
  const pool = futureOpen.length > 0 ? futureOpen : openEvents

  return [...pool]
    .sort((a, b) => new Date(a.registration_deadline).getTime() - new Date(b.registration_deadline).getTime())
    .slice(0, limit)
}

export interface BrowseCounts {
  technical: number | null
  cultural: number | null
  workshops: number | null
  online: number | null
  free: number | null
}

/**
 * Compute counts for the "Browse the sky" tiles.
 */
export function computeBrowseCounts(events: EventSummary[] | null): BrowseCounts {
  if (!events) {
    return { technical: null, cultural: null, workshops: null, online: null, free: null }
  }

  return {
    technical: events.filter((e) => e.is_technical).length,
    cultural: events.filter((e) => !e.is_technical).length,
    workshops: events.filter((e) => e.event_type === 'WORKSHOP').length,
    online: events.filter((e) => e.event_mode === 'ONLINE').length,
    free: events.filter((e) => e.price === 0).length,
  }
}

export interface MonthGroup {
  key: string
  label: string
  events: EventSummary[]
}

/**
 * Group events chronologically by month (e.g. Sep -> Nov).
 */
export function groupEventsByMonth(events: EventSummary[] | null): MonthGroup[] {
  if (!events || events.length === 0) return []

  const sorted = [...events].sort((a, b) => {
    const timeA = istDate(a.schedule_summary.start_date, a.schedule_summary.start_time).getTime()
    const timeB = istDate(b.schedule_summary.start_date, b.schedule_summary.start_time).getTime()
    return timeA - timeB
  })

  const map = new Map<string, EventSummary[]>()
  for (const event of sorted) {
    const key = monthKey(event.schedule_summary.start_date)
    const list = map.get(key)
    if (list) {
      list.push(event)
    } else {
      map.set(key, [event])
    }
  }

  const groups: MonthGroup[] = []
  for (const [key, evts] of map.entries()) {
    groups.push({
      key,
      label: formatMonth(key),
      events: evts,
    })
  }

  return groups
}
