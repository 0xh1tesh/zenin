import type { EventDetail, EventSummary } from '../../types'
import { istDate } from '../../lib/format'

/** Splits raw event description on blank lines into paragraphs. */
export function splitDescription(description?: string): string[] {
  if (!description) return []
  return description
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

const ORDINAL: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
}

/** Formats rank integer into ordinal string (e.g. 1 -> '1st', 2 -> '2nd', 4 -> '4th'). */
export function ordinal(n: number): string {
  if (n in ORDINAL) return ORDINAL[n]
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

/** Builds schema.org Event JSON-LD graph. */
export function buildEventJsonLd(event: EventDetail, currentUrl?: string): Record<string, unknown> {
  const { start_date, start_time, end_date, end_time } = event.schedule_summary
  const startDate = istDate(start_date, start_time).toISOString()
  const endDate = istDate(end_date, end_time).toISOString()
  const isOnline = event.event_mode === 'ONLINE'
  const isRegistrable = event.registration_status === 'OPEN' && event.event_status === 'ACTIVE'
  const venue = event.schedules[0]?.venue || 'Pune Campus'

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.blurb || event.description.slice(0, 250),
    startDate,
    endDate,
    eventAttendanceMode: isOnline
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus:
      event.event_status === 'COMPLETED'
        ? 'https://schema.org/EventMovedOnline'
        : 'https://schema.org/EventScheduled',
    image: [event.banner_image_url || event.cover_image_url].filter(Boolean),
    location: isOnline
      ? {
          '@type': 'VirtualLocation',
          url: currentUrl || undefined,
        }
      : {
          '@type': 'Place',
          name: venue,
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Pune',
            addressCountry: 'IN',
          },
        },
    offers: {
      '@type': 'Offer',
      price: event.price,
      priceCurrency: 'INR',
      availability: isRegistrable ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      validThrough: event.registration_deadline,
      url: currentUrl || undefined,
    },
    organizer: (event.organizers || []).map((org) => ({
      '@type': 'Organization',
      name: org.name,
    })),
  }
}

/** Finds related events from list: same category first, then same kind. */
export function getRelatedEvents(
  current: Pick<EventSummary, 'id' | 'category' | 'event_type'>,
  allEvents: EventSummary[],
  limit = 3,
): EventSummary[] {
  const candidates = allEvents.filter((e) => e.id !== current.id)

  const sameCat = candidates.filter((e) => e.category === current.category)
  const sameKind = candidates.filter((e) => e.category !== current.category && e.event_type === current.event_type)
  const other = candidates.filter((e) => e.category !== current.category && e.event_type !== current.event_type)

  return [...sameCat, ...sameKind, ...other].slice(0, limit)
}

/** Finds chronologically previous and next events by start instant. */
export function getPrevNextEvents(
  current: Pick<EventSummary, 'id'>,
  allEvents: EventSummary[],
): { prev: EventSummary | null; next: EventSummary | null } {
  if (allEvents.length <= 1) return { prev: null, next: null }

  const sorted = [...allEvents].sort((a, b) => {
    const da = `${a.schedule_summary.start_date}T${a.schedule_summary.start_time}`
    const db = `${b.schedule_summary.start_date}T${b.schedule_summary.start_time}`
    return da.localeCompare(db)
  })

  const index = sorted.findIndex((e) => e.id === current.id)
  if (index === -1) return { prev: null, next: null }

  return {
    prev: index > 0 ? sorted[index - 1] : null,
    next: index < sorted.length - 1 ? sorted[index + 1] : null,
  }
}
