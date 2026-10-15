import type { EventDetail, EventSummary } from '../types'
import { istDate } from './format'

const CRLF = '\r\n'
const HOUR_MS = 3_600_000

export interface IcsEvent {
  uid: string
  title: string
  description?: string
  location?: string
  url?: string
  start: Date
  end: Date
  /** Minutes before start to fire a reminder. */
  alarmMinutes?: number
}

export function toIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

const escapeText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** RFC 5545 line folding at 75 characters. */
function fold(line: string): string {
  const parts: string[] = []
  let rest = line
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75))
    rest = ' ' + rest.slice(75)
  }
  parts.push(rest)
  return parts.join(CRLF)
}

export function buildIcs(events: IcsEvent[]): string {
  const stamp = toIcsDate(new Date())
  const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Zenin 26//Events//EN', 'CALSCALE:GREGORIAN']
  for (const ev of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.uid}@zenin26`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsDate(ev.start)}`,
      `DTEND:${toIcsDate(ev.end)}`,
      `SUMMARY:${escapeText(ev.title)}`,
    )
    if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`)
    if (ev.location) lines.push(`LOCATION:${escapeText(ev.location)}`)
    if (ev.url) lines.push(`URL:${ev.url}`)
    if (ev.alarmMinutes !== undefined) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(ev.title)}`,
        `TRIGGER:-PT${ev.alarmMinutes}M`,
        'END:VALARM',
      )
    }
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join(CRLF) + CRLF
}

function venueOf(e: EventSummary | EventDetail): string | undefined {
  return 'schedules' in e ? e.schedules[0]?.venue : undefined
}

export function eventToIcs(e: EventSummary | EventDetail, url?: string): string {
  const { start_date, start_time, end_date, end_time } = e.schedule_summary
  return buildIcs([
    {
      uid: e.id,
      title: e.name,
      description: [e.blurb, url].filter(Boolean).join('\n'),
      location: venueOf(e) ?? (e.event_mode === 'ONLINE' ? 'Online' : undefined),
      url,
      start: istDate(start_date, start_time),
      end: istDate(end_date, end_time),
      alarmMinutes: 60,
    },
  ])
}

/** A reminder that fires an hour before registration closes. */
export function deadlineToIcs(e: EventSummary | EventDetail, url?: string): string {
  const deadline = new Date(e.registration_deadline)
  return buildIcs([
    {
      uid: `${e.id}-deadline`,
      title: `Register for ${e.name} (closes soon)`,
      description: [`Registration for ${e.name} closes at this time.`, url].filter(Boolean).join('\n'),
      url,
      start: new Date(deadline.getTime() - HOUR_MS / 2),
      end: deadline,
      alarmMinutes: 60,
    },
  ])
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}
