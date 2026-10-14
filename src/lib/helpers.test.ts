import { describe, expect, it } from 'vitest'
import { registrationState } from '../components/ui/StatusBadge'
import {
  fillRatio,
  formatPrice,
  formatTeam,
  formatTime,
  monthKey,
  seatsLeft,
  splitDuration,
} from './format'
import { buildIcs, deadlineToIcs, toIcsDate } from './ics'
import { resizeImage, responsiveImage } from './image'
import type { EventSummary } from '../types'

describe('image helpers', () => {
  const src = 'https://images.pexels.com/photos/1/pexels-photo-1.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop'

  it('rewrites pexels urls to the requested size and format', () => {
    const url = new URL(resizeImage(src, 480, 320))
    expect(url.searchParams.get('w')).toBe('480')
    expect(url.searchParams.get('h')).toBe('320')
    expect(url.searchParams.get('fm')).toBe('webp')
  })

  it('drops the crop params when no height is given', () => {
    const url = new URL(resizeImage(src, 800))
    expect(url.searchParams.has('h')).toBe(false)
    expect(url.searchParams.has('fit')).toBe(false)
  })

  it('leaves other hosts untouched and tolerates garbage', () => {
    expect(resizeImage('https://example.com/a.jpg', 400)).toBe('https://example.com/a.jpg')
    expect(resizeImage('not a url', 400)).toBe('not a url')
  })

  it('builds a srcset with intrinsic dimensions and returns null for an empty url', () => {
    const img = responsiveImage(src, { widths: [640, 400, 960], ratio: 3 / 2, sizes: '100vw' })
    expect(img?.srcSet.split(', ')).toHaveLength(3)
    expect(img?.srcSet.startsWith(resizeImage(src, 400, 400 / 1.5))).toBe(true)
    expect(img?.width).toBe(960)
    expect(img?.height).toBe(640)
    expect(responsiveImage('', { widths: [400], sizes: '100vw' })).toBeNull()
  })
})

describe('calendar files', () => {
  it('formats UTC timestamps without separators', () => {
    expect(toIcsDate(new Date('2026-11-13T12:30:00.000Z'))).toBe('20261113T123000Z')
  })

  it('escapes text, uses CRLF and wraps events in a calendar', () => {
    const ics = buildIcs([
      {
        uid: 'a',
        title: 'Hack, Build; Ship',
        description: 'Line one\nLine two',
        start: new Date('2026-11-13T12:30:00Z'),
        end: new Date('2026-11-13T14:30:00Z'),
        alarmMinutes: 30,
      },
    ])
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics).toContain('SUMMARY:Hack\\, Build\\; Ship')
    expect(ics).toContain('DESCRIPTION:Line one\\nLine two')
    expect(ics).toContain('TRIGGER:-PT30M')
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
  })

  it('creates a deadline reminder that ends exactly at the deadline', () => {
    const event = { id: 'e1', name: 'Orbit Hack', registration_deadline: '2026-11-10T18:00:00+05:30' } as EventSummary
    const ics = deadlineToIcs(event)
    expect(ics).toContain('DTEND:20261110T123000Z')
    expect(ics).toContain('DTSTART:20261110T120000Z')
  })
})

describe('format helpers', () => {
  it('formats times in 12-hour form', () => {
    expect(formatTime('00:05')).toBe('12:05 am')
    expect(formatTime('18:00')).toBe('6:00 pm')
    expect(formatTime('12:30')).toBe('12:30 pm')
  })

  it('describes team sizes', () => {
    expect(formatTeam({ min_teamsize: 1, max_teamsize: 1 })).toBe('Solo')
    expect(formatTeam({ min_teamsize: 1, max_teamsize: 3 })).toBe('Solo or teams up to 3')
    expect(formatTeam({ min_teamsize: 2, max_teamsize: 2 })).toBe('Teams of 2')
    expect(formatTeam({ min_teamsize: 2, max_teamsize: 4 })).toBe('Teams of 2–4')
  })

  it('describes prices per person or per team', () => {
    expect(formatPrice({ price: 0, is_per_head: true })).toBe('Free')
    expect(formatPrice({ price: 800, is_per_head: false })).toMatch(/800.*\/ team/)
    expect(formatPrice({ price: 99, is_per_head: true })).toMatch(/99.*\/ person/)
  })

  it('computes seats and fill ratio safely', () => {
    expect(seatsLeft({ total_seats: 40, seats_filled: 34 })).toBe(6)
    expect(seatsLeft({ total_seats: 10, seats_filled: 12 })).toBe(0)
    expect(fillRatio({ total_seats: 0, seats_filled: 0 })).toBe(0)
    expect(fillRatio({ total_seats: 40, seats_filled: 10 })).toBe(0.25)
  })

  it('splits durations and groups months', () => {
    expect(splitDuration(2 * 86_400_000 + 3 * 3_600_000 + 4 * 60_000 + 5000)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
    })
    expect(splitDuration(-1000).days).toBe(0)
    expect(monthKey('2026-11-13')).toBe('2026-11')
  })
})

describe('registrationState', () => {
  it('only opens registration for active events with open registration', () => {
    expect(registrationState({ event_status: 'ACTIVE', registration_status: 'OPEN' }).registrable).toBe(true)
    expect(registrationState({ event_status: 'ACTIVE', registration_status: 'SOLD_OUT' })).toMatchObject({
      tone: 'sold',
      registrable: false,
    })
    expect(registrationState({ event_status: 'ACTIVE', registration_status: 'CLOSED' }).registrable).toBe(false)
  })

  it('labels finished events as archive, whatever the registration status says', () => {
    expect(registrationState({ event_status: 'COMPLETED', registration_status: 'OPEN' })).toMatchObject({
      label: 'Archive',
      registrable: false,
    })
    expect(registrationState({ event_status: 'CLOSED', registration_status: 'OPEN' }).tone).toBe('closed')
  })
})
