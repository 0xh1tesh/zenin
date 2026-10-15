import { describe, expect, it } from 'vitest'
import type { EventSummary } from '../../types'
import {
  computeBrowseCounts,
  computeHeroStats,
  daysFromNow,
  daysToNext,
  eventStartDate,
  getClosingSoonEvents,
  groupEventsByMonth,
  isWithinHours,
  startsInFuture,
} from './helpers'

/** Minimal EventSummary factory for tests. */
function makeEvent(overrides: Partial<EventSummary> = {}): EventSummary {
  return {
    id: 'test-id',
    name: 'Test Event',
    blurb: 'A test event',
    cover_image_url: '',
    cover_image_alt: '',
    category: 'Technical',
    tags: [],
    event_type: 'EVENT',
    event_mode: 'OFFLINE',
    event_status: 'ACTIVE',
    is_featured: false,
    is_technical: true,
    price: 0,
    is_per_head: false,
    min_teamsize: 1,
    max_teamsize: 1,
    total_seats: 100,
    seats_filled: 0,
    registration_status: 'OPEN',
    registration_deadline: '2026-11-01T00:00:00+05:30',
    schedule_summary: {
      start_date: '2026-11-15',
      start_time: '10:00',
      end_date: '2026-11-15',
      end_time: '18:00',
    },
    ...overrides,
  }
}

const FAR_FUTURE = '2099-01-01'
const PAST = '2020-01-01'

describe('eventStartDate', () => {
  it('returns an IST Date from schedule_summary', () => {
    const e = makeEvent({
      schedule_summary: { start_date: '2026-10-01', start_time: '09:00', end_date: '2026-10-01', end_time: '17:00' },
    })
    const d = eventStartDate(e)
    expect(d).toBeInstanceOf(Date)
    expect(d.toISOString()).toBe('2026-10-01T03:30:00.000Z') // 09:00 IST = 03:30 UTC
  })
})

describe('daysFromNow', () => {
  it('returns 0 when target is in the past', () => {
    expect(daysFromNow(new Date('2020-01-01'), Date.now())).toBe(0)
  })
  it('returns ceil of fractional days', () => {
    const now = new Date('2026-10-01T00:00:00Z').getTime()
    const target = new Date('2026-10-02T12:00:00Z') // 1.5 days ahead
    expect(daysFromNow(target, now)).toBe(2)
  })
})

describe('startsInFuture', () => {
  it('true when start is after now', () => {
    const e = makeEvent({
      schedule_summary: { start_date: FAR_FUTURE, start_time: '10:00', end_date: FAR_FUTURE, end_time: '18:00' },
    })
    expect(startsInFuture(e)).toBe(true)
  })
  it('false when start is in the past', () => {
    const e = makeEvent({
      schedule_summary: { start_date: PAST, start_time: '10:00', end_date: PAST, end_time: '18:00' },
    })
    expect(startsInFuture(e)).toBe(false)
  })
})

describe('computeHeroStats', () => {
  it('returns all-null for null input', () => {
    expect(computeHeroStats(null)).toEqual({ total: null, open: null, free: null, nextEvent: null })
  })

  it('counts correctly', () => {
    const events: EventSummary[] = [
      makeEvent({ id: 'a', price: 0, registration_status: 'OPEN', event_status: 'ACTIVE' }),
      makeEvent({ id: 'b', price: 200, registration_status: 'CLOSED', event_status: 'ACTIVE' }),
      makeEvent({ id: 'c', price: 0, registration_status: 'OPEN', event_status: 'COMPLETED' }),
    ]
    const stats = computeHeroStats(events)
    expect(stats.total).toBe(3)
    expect(stats.open).toBe(1) // only 'a': OPEN + ACTIVE
    expect(stats.free).toBe(2) // 'a' and 'c'
  })

  it('picks the earliest ACTIVE future event as nextEvent', () => {
    const nearDate = '2099-06-01'
    const farDate = '2099-12-01'
    const events: EventSummary[] = [
      makeEvent({
        id: 'far',
        name: 'Far Event',
        event_status: 'ACTIVE',
        schedule_summary: { start_date: farDate, start_time: '10:00', end_date: farDate, end_time: '18:00' },
      }),
      makeEvent({
        id: 'near',
        name: 'Near Event',
        event_status: 'ACTIVE',
        schedule_summary: { start_date: nearDate, start_time: '10:00', end_date: nearDate, end_time: '18:00' },
      }),
    ]
    const stats = computeHeroStats(events)
    expect(stats.nextEvent?.name).toBe('Near Event')
    expect(stats.nextEvent?.startsAt).toContain('+05:30')
  })

  it('returns null nextEvent when no future active events', () => {
    const events: EventSummary[] = [
      makeEvent({
        event_status: 'COMPLETED',
        schedule_summary: { start_date: PAST, start_time: '10:00', end_date: PAST, end_time: '18:00' },
      }),
    ]
    expect(computeHeroStats(events).nextEvent).toBeNull()
  })
})

describe('daysToNext', () => {
  it('returns null for null input', () => {
    expect(daysToNext(null)).toBeNull()
  })

  it('returns null when no future active events', () => {
    const events = [makeEvent({ event_status: 'COMPLETED' })]
    expect(daysToNext(events)).toBeNull()
  })

  it('returns a non-negative number for a future event', () => {
    const e = makeEvent({
      event_status: 'ACTIVE',
      schedule_summary: { start_date: FAR_FUTURE, start_time: '10:00', end_date: FAR_FUTURE, end_time: '18:00' },
    })
    const days = daysToNext([e])
    expect(typeof days).toBe('number')
    expect(days).toBeGreaterThan(0)
  })
})

describe('getClosingSoonEvents', () => {
  it('returns empty array for null or empty input', () => {
    expect(getClosingSoonEvents(null)).toEqual([])
    expect(getClosingSoonEvents([])).toEqual([])
  })

  it('filters registrable events and orders by deadline ascending', () => {
    const now = new Date('2026-10-01T00:00:00Z').getTime()
    const events = [
      makeEvent({
        id: 'e3',
        registration_deadline: '2026-10-25T18:00:00+05:30',
        registration_status: 'OPEN',
        event_status: 'ACTIVE',
      }),
      makeEvent({
        id: 'e1',
        registration_deadline: '2026-10-10T18:00:00+05:30',
        registration_status: 'OPEN',
        event_status: 'ACTIVE',
      }),
      makeEvent({
        id: 'e2',
        registration_deadline: '2026-10-15T18:00:00+05:30',
        registration_status: 'OPEN',
        event_status: 'ACTIVE',
      }),
      makeEvent({
        id: 'closed',
        registration_deadline: '2026-10-05T18:00:00+05:30',
        registration_status: 'CLOSED',
        event_status: 'ACTIVE',
      }),
    ]

    const closing = getClosingSoonEvents(events, 2, now)
    expect(closing.length).toBe(2)
    expect(closing[0].id).toBe('e1')
    expect(closing[1].id).toBe('e2')
  })
})

describe('computeBrowseCounts', () => {
  it('returns all null when events is null', () => {
    expect(computeBrowseCounts(null)).toEqual({
      technical: null,
      cultural: null,
      workshops: null,
      online: null,
      free: null,
    })
  })

  it('correctly aggregates category counts', () => {
    const events = [
      makeEvent({ id: '1', is_technical: true, event_type: 'EVENT', event_mode: 'OFFLINE', price: 500 }),
      makeEvent({ id: '2', is_technical: false, event_type: 'WORKSHOP', event_mode: 'ONLINE', price: 0 }),
      makeEvent({ id: '3', is_technical: true, event_type: 'WORKSHOP', event_mode: 'ONLINE', price: 0 }),
    ]

    const counts = computeBrowseCounts(events)
    expect(counts.technical).toBe(2)
    expect(counts.cultural).toBe(1)
    expect(counts.workshops).toBe(2)
    expect(counts.online).toBe(2)
    expect(counts.free).toBe(2)
  })
})

describe('groupEventsByMonth', () => {
  it('returns empty array when events is null or empty', () => {
    expect(groupEventsByMonth(null)).toEqual([])
    expect(groupEventsByMonth([])).toEqual([])
  })

  it('groups and sorts events chronologically', () => {
    const events = [
      makeEvent({
        id: 'nov',
        name: 'November Event',
        schedule_summary: { start_date: '2026-11-10', start_time: '10:00', end_date: '2026-11-10', end_time: '18:00' },
      }),
      makeEvent({
        id: 'sep',
        name: 'September Event',
        schedule_summary: { start_date: '2026-09-26', start_time: '09:00', end_date: '2026-09-26', end_time: '17:00' },
      }),
      makeEvent({
        id: 'oct',
        name: 'October Event',
        schedule_summary: { start_date: '2026-10-18', start_time: '11:00', end_date: '2026-10-18', end_time: '15:00' },
      }),
    ]

    const groups = groupEventsByMonth(events)
    expect(groups.length).toBe(3)
    expect(groups[0].key).toBe('2026-09')
    expect(groups[0].events[0].id).toBe('sep')
    expect(groups[1].key).toBe('2026-10')
    expect(groups[1].events[0].id).toBe('oct')
    expect(groups[2].key).toBe('2026-11')
    expect(groups[2].events[0].id).toBe('nov')
  })
})

describe('isWithinHours (via home/helpers)', () => {
  const NOW = new Date('2026-10-15T12:00:00Z').getTime()

  it('identifies deadlines within 72 hours', () => {
    const inside = new Date(NOW + 24 * 3600 * 1000).toISOString()
    expect(isWithinHours(inside, 72, NOW)).toBe(true)
  })

  it('rejects deadlines beyond 72 hours or in the past', () => {
    const past = new Date(NOW - 1000).toISOString()
    const future = new Date(NOW + 80 * 3600 * 1000).toISOString()
    expect(isWithinHours(past, 72, NOW)).toBe(false)
    expect(isWithinHours(future, 72, NOW)).toBe(false)
  })
})

