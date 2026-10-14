import { describe, expect, it } from 'vitest'
import { ApiError } from './errors'
import { parseEventDetail, parseEventList, toEventSummary } from './validate'

const raw = (over: Record<string, unknown> = {}) => ({
  id: 'evt-1',
  name: 'Orbit Hack',
  blurb: 'A hackathon',
  cover_image_url: 'https://images.pexels.com/photos/1/pexels-photo-1.jpeg?w=1200',
  cover_image_alt: 'Laptops',
  category: 'Hackathon',
  tags: ['AI', 7, 'Web'],
  event_type: 'EVENT',
  event_mode: 'OFFLINE',
  event_status: 'ACTIVE',
  is_featured: true,
  is_technical: true,
  price: 800,
  is_per_head: false,
  min_teamsize: 2,
  max_teamsize: 4,
  total_seats: 40,
  seats_filled: 34,
  registration_status: 'OPEN',
  registration_deadline: '2026-11-10T18:00:00+05:30',
  schedule_summary: { start_date: '2026-11-13', start_time: '18:00', end_date: '2026-11-14', end_time: '18:00' },
  ...over,
})

describe('toEventSummary', () => {
  it('accepts a complete event and drops non-string tags', () => {
    const e = toEventSummary(raw())
    expect(e?.id).toBe('evt-1')
    expect(e?.tags).toEqual(['AI', 'Web'])
    expect(e?.registration_deadline).toBe('2026-11-10T18:00:00+05:30')
  })

  it('rejects items without an id, a name or a valid schedule', () => {
    expect(toEventSummary(raw({ id: '' }))).toBeNull()
    expect(toEventSummary(raw({ name: undefined }))).toBeNull()
    expect(toEventSummary(raw({ schedule_summary: { start_date: 'tomorrow' } }))).toBeNull()
    expect(toEventSummary(null)).toBeNull()
    expect(toEventSummary('event')).toBeNull()
  })

  it('clamps seats and falls back on unknown enums and bad deadlines', () => {
    const e = toEventSummary(raw({ seats_filled: 99, event_type: 'PARTY', registration_deadline: 'soon' }))
    expect(e?.seats_filled).toBe(40)
    expect(e?.event_type).toBe('EVENT')
    expect(e?.registration_deadline).toBe('2026-11-13T00:00:00+05:30')
  })

  it('never reports a negative price or a team size below one', () => {
    const e = toEventSummary(raw({ price: -5, min_teamsize: 0, max_teamsize: 0 }))
    expect(e?.price).toBe(0)
    expect(e?.min_teamsize).toBe(1)
    expect(e?.max_teamsize).toBe(1)
  })
})

describe('parseEventList', () => {
  it('treats an empty list as valid', () => {
    expect(parseEventList({ events: [] })).toEqual([])
  })

  it('keeps valid items and drops broken ones', () => {
    const list = parseEventList({ events: [raw(), { nope: true }, raw({ id: 'evt-2' })] })
    expect(list.map((e) => e.id)).toEqual(['evt-1', 'evt-2'])
  })

  it('throws a parse error when the shape is wrong or nothing is readable', () => {
    for (const body of [{}, { events: 'x' }, null, [], { events: [{ nope: 1 }] }]) {
      expect(() => parseEventList(body)).toThrow(ApiError)
    }
  })
})

describe('parseEventDetail', () => {
  it('normalises missing arrays and sorts prizes by rank', () => {
    const d = parseEventDetail({
      event: raw({
        description: 'One\n\nTwo',
        prizes: [
          { rank: 3, title: 'Third', amount: 1 },
          { rank: 1, title: 'First', amount: 3 },
        ],
      }),
    })
    expect(d.highlights).toEqual([])
    expect(d.faqs).toEqual([])
    expect(d.prizes.map((p) => p.title)).toEqual(['First', 'Third'])
    expect(d.banner_image_url).toBe(d.cover_image_url)
  })

  it('throws when the event is missing or unreadable', () => {
    expect(() => parseEventDetail({})).toThrow(ApiError)
    expect(() => parseEventDetail({ event: { id: 'x' } })).toThrow(ApiError)
  })
})
