import { describe, expect, it } from 'vitest'
import {
  buildEventJsonLd,
  getPrevNextEvents,
  getRelatedEvents,
  ordinal,
  splitDescription,
} from './helpers'
import type { EventDetail, EventSummary } from '../../types'

describe('splitDescription', () => {
  it('handles empty or undefined string', () => {
    expect(splitDescription(undefined)).toEqual([])
    expect(splitDescription('')).toEqual([])
    expect(splitDescription('   \n\n  ')).toEqual([])
  })

  it('splits paragraphs on single and multiple blank lines', () => {
    const raw = 'First paragraph.\n\nSecond paragraph.\n\n\nThird paragraph.'
    expect(splitDescription(raw)).toEqual([
      'First paragraph.',
      'Second paragraph.',
      'Third paragraph.',
    ])
  })

  it('trims whitespace around paragraphs', () => {
    const raw = '  Alpha beta.  \n\n   Gamma delta.  '
    expect(splitDescription(raw)).toEqual(['Alpha beta.', 'Gamma delta.'])
  })
})

describe('ordinal', () => {
  it('formats standard ordinals correctly', () => {
    expect(ordinal(1)).toBe('1st')
    expect(ordinal(2)).toBe('2nd')
    expect(ordinal(3)).toBe('3rd')
    expect(ordinal(4)).toBe('4th')
    expect(ordinal(11)).toBe('11th')
    expect(ordinal(12)).toBe('12th')
    expect(ordinal(13)).toBe('13th')
    expect(ordinal(21)).toBe('21st')
    expect(ordinal(22)).toBe('22nd')
    expect(ordinal(23)).toBe('23rd')
    expect(ordinal(24)).toBe('24th')
  })
})

const mockDetail: EventDetail = {
  id: 'ev-1',
  name: 'Cosmic Hackathon',
  blurb: 'Build for the stars in 24h.',
  description: 'First block.\n\nSecond block.',
  category: 'Hackathon',
  tags: ['AI', 'Web'],
  event_type: 'EVENT',
  event_mode: 'OFFLINE',
  event_status: 'ACTIVE',
  is_featured: true,
  is_technical: true,
  price: 500,
  is_per_head: false,
  min_teamsize: 2,
  max_teamsize: 4,
  total_seats: 50,
  seats_filled: 25,
  registration_status: 'OPEN',
  registration_deadline: '2026-11-10T18:00:00+05:30',
  cover_image_url: 'https://example.com/cover.jpg',
  cover_image_alt: 'Cover alt',
  banner_image_url: 'https://example.com/banner.jpg',
  banner_image_alt: 'Banner alt',
  gallery_images: ['https://example.com/g1.jpg'],
  highlights: ['Great prizes', 'Mentors'],
  what_to_expect: ['Fun', 'Learning'],
  eligibility: ['College students'],
  prerequisites: ['Laptop'],
  rules: ['Be respectful'],
  prizes: [{ rank: 1, title: 'Gold', amount: 50000, description: 'Top team' }],
  faqs: [{ question: 'Is food provided?', answer: 'Yes, meals are included.' }],
  schedules: [
    {
      event_date: '2026-11-13',
      start_time: '09:00',
      end_time: '18:00',
      venue: 'Auditorium Hall A',
    },
  ],
  organizers: [{ id: 'org-1', name: 'Tech Club', org_type: 'CLUB' }],
  coordinators: [{ id: 'c-1', name: 'Aarav', role: 'Lead', contact: 'aarav@example.com' }],
  schedule_summary: {
    start_date: '2026-11-13',
    start_time: '09:00',
    end_date: '2026-11-13',
    end_time: '18:00',
  },
}

describe('buildEventJsonLd', () => {
  it('constructs schema.org Event metadata correctly', () => {
    const jsonLd = buildEventJsonLd(mockDetail, 'https://zenin26.fest/events/ev-1')
    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@type']).toBe('Event')
    expect(jsonLd.name).toBe('Cosmic Hackathon')
    expect(jsonLd.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode')
    expect(jsonLd.eventStatus).toBe('https://schema.org/EventScheduled')

    const location = jsonLd.location as Record<string, unknown>
    expect(location['@type']).toBe('Place')
    expect(location.name).toBe('Auditorium Hall A')

    const offers = jsonLd.offers as Record<string, unknown>
    expect(offers.price).toBe(500)
    expect(offers.priceCurrency).toBe('INR')
    expect(offers.availability).toBe('https://schema.org/InStock')
  })

  it('handles online mode correctly', () => {
    const onlineDetail: EventDetail = {
      ...mockDetail,
      event_mode: 'ONLINE',
      registration_status: 'SOLD_OUT',
    }
    const jsonLd = buildEventJsonLd(onlineDetail, 'https://zenin26.fest/events/ev-1')
    expect(jsonLd.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode')
    const location = jsonLd.location as Record<string, unknown>
    expect(location['@type']).toBe('VirtualLocation')

    const offers = jsonLd.offers as Record<string, unknown>
    expect(offers.availability).toBe('https://schema.org/SoldOut')
  })
})

describe('getRelatedEvents', () => {
  const allEvents: EventSummary[] = [
    { ...mockDetail, id: 'ev-1', category: 'Hackathon', event_type: 'EVENT' },
    { ...mockDetail, id: 'ev-2', category: 'Hackathon', event_type: 'EVENT' },
    { ...mockDetail, id: 'ev-3', category: 'Design', event_type: 'EVENT' },
    { ...mockDetail, id: 'ev-4', category: 'Coding', event_type: 'WORKSHOP' },
  ]

  it('excludes current event and prioritizes same category', () => {
    const related = getRelatedEvents({ id: 'ev-1', category: 'Hackathon', event_type: 'EVENT' }, allEvents, 2)
    expect(related.length).toBe(2)
    expect(related[0].id).toBe('ev-2') // Same category
    expect(related[1].id).toBe('ev-3') // Same kind (EVENT)
  })
})

describe('getPrevNextEvents', () => {
  const events: EventSummary[] = [
    {
      ...mockDetail,
      id: 'e1',
      schedule_summary: { start_date: '2026-11-13', start_time: '09:00', end_date: '2026-11-13', end_time: '12:00' },
    },
    {
      ...mockDetail,
      id: 'e2',
      schedule_summary: { start_date: '2026-11-14', start_time: '10:00', end_date: '2026-11-14', end_time: '14:00' },
    },
    {
      ...mockDetail,
      id: 'e3',
      schedule_summary: { start_date: '2026-11-15', start_time: '09:00', end_date: '2026-11-15', end_time: '17:00' },
    },
  ]

  it('returns previous and next events in chronological sequence', () => {
    const mid = getPrevNextEvents({ id: 'e2' }, events)
    expect(mid.prev?.id).toBe('e1')
    expect(mid.next?.id).toBe('e3')

    const first = getPrevNextEvents({ id: 'e1' }, events)
    expect(first.prev).toBeNull()
    expect(first.next?.id).toBe('e2')

    const last = getPrevNextEvents({ id: 'e3' }, events)
    expect(last.prev?.id).toBe('e2')
    expect(last.next).toBeNull()
  })
})
