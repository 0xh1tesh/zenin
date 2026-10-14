import type {
  Coordinator,
  EventDetail,
  EventMode,
  EventStatus,
  EventSummary,
  EventType,
  Faq,
  Organizer,
  Prize,
  RegistrationStatus,
  ScheduleSummary,
  Session,
} from '../types'
import { ApiError } from './errors'

type Rec = Record<string, unknown>

const isRecord = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback
const bool = (v: unknown, fallback = false): boolean => (typeof v === 'boolean' ? v : fallback)
const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0) : []

function oneOf<T extends string>(v: unknown, options: readonly T[], fallback: T): T {
  return typeof v === 'string' && (options as readonly string[]).includes(v) ? (v as T) : fallback
}

function mapRecords<T>(v: unknown, fn: (r: Rec) => T | null): T[] {
  if (!Array.isArray(v)) return []
  const out: T[] = []
  for (const item of v) {
    if (!isRecord(item)) continue
    const mapped = fn(item)
    if (mapped) out.push(mapped)
  }
  return out
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/

function toSchedule(v: unknown): ScheduleSummary | null {
  if (!isRecord(v)) return null
  const { start_date, end_date, start_time, end_time } = v
  if (typeof start_date !== 'string' || !DATE_RE.test(start_date)) return null
  return {
    start_date,
    start_time: typeof start_time === 'string' && TIME_RE.test(start_time) ? start_time : '00:00',
    end_date: typeof end_date === 'string' && DATE_RE.test(end_date) ? end_date : start_date,
    end_time: typeof end_time === 'string' && TIME_RE.test(end_time) ? end_time : '23:59',
  }
}

const EVENT_TYPES: readonly EventType[] = ['EVENT', 'WORKSHOP']
const MODES: readonly EventMode[] = ['ONLINE', 'OFFLINE']
const STATUSES: readonly EventStatus[] = ['ACTIVE', 'COMPLETED', 'CLOSED']
const REG: readonly RegistrationStatus[] = ['OPEN', 'CLOSED', 'SOLD_OUT']

/** Returns null when an item is too broken to display (no id, name or schedule). */
export function toEventSummary(v: unknown): EventSummary | null {
  if (!isRecord(v)) return null
  const id = str(v.id)
  const name = str(v.name)
  const schedule = toSchedule(v.schedule_summary)
  if (!id || !name || !schedule) return null

  const deadline = str(v.registration_deadline)
  const deadlineOk = deadline !== '' && !Number.isNaN(new Date(deadline).getTime())
  const total = Math.max(0, num(v.total_seats))
  const filled = Math.min(total, Math.max(0, num(v.seats_filled)))

  return {
    id,
    name,
    blurb: str(v.blurb),
    cover_image_url: str(v.cover_image_url),
    cover_image_alt: str(v.cover_image_alt, name),
    category: str(v.category, 'Event'),
    tags: strArray(v.tags),
    event_type: oneOf(v.event_type, EVENT_TYPES, 'EVENT'),
    event_mode: oneOf(v.event_mode, MODES, 'OFFLINE'),
    event_status: oneOf(v.event_status, STATUSES, 'ACTIVE'),
    is_featured: bool(v.is_featured),
    is_technical: bool(v.is_technical),
    price: Math.max(0, num(v.price)),
    is_per_head: bool(v.is_per_head, true),
    min_teamsize: Math.max(1, num(v.min_teamsize, 1)),
    max_teamsize: Math.max(1, num(v.max_teamsize, 1)),
    total_seats: total,
    seats_filled: filled,
    registration_status: oneOf(v.registration_status, REG, 'CLOSED'),
    registration_deadline: deadlineOk ? deadline : `${schedule.start_date}T00:00:00+05:30`,
    schedule_summary: schedule,
  }
}

const toPrize = (r: Rec): Prize | null =>
  r.title ? { rank: num(r.rank, 99), title: str(r.title), amount: num(r.amount), description: str(r.description) } : null
const toFaq = (r: Rec): Faq | null =>
  r.question && r.answer ? { question: str(r.question), answer: str(r.answer) } : null
const toSession = (r: Rec): Session | null =>
  typeof r.event_date === 'string' && DATE_RE.test(r.event_date)
    ? {
        event_date: r.event_date,
        start_time: str(r.start_time, '00:00'),
        end_time: str(r.end_time, '23:59'),
        venue: str(r.venue, 'To be announced'),
      }
    : null
const toOrganizer = (r: Rec): Organizer | null =>
  r.name ? { id: str(r.id, str(r.name)), name: str(r.name), org_type: str(r.org_type) } : null
const toCoordinator = (r: Rec): Coordinator | null =>
  r.name ? { id: str(r.id, str(r.name)), name: str(r.name), role: str(r.role), contact: str(r.contact) } : null

export function toEventDetail(v: unknown): EventDetail | null {
  const summary = toEventSummary(v)
  if (!summary || !isRecord(v)) return null
  return {
    ...summary,
    description: str(v.description),
    banner_image_url: str(v.banner_image_url, summary.cover_image_url),
    banner_image_alt: str(v.banner_image_alt, summary.cover_image_alt),
    gallery_images: strArray(v.gallery_images),
    highlights: strArray(v.highlights),
    what_to_expect: strArray(v.what_to_expect),
    eligibility: strArray(v.eligibility),
    prerequisites: strArray(v.prerequisites),
    rules: strArray(v.rules),
    prizes: mapRecords(v.prizes, toPrize).sort((a, b) => a.rank - b.rank),
    faqs: mapRecords(v.faqs, toFaq),
    schedules: mapRecords(v.schedules, toSession),
    organizers: mapRecords(v.organizers, toOrganizer),
    coordinators: mapRecords(v.coordinators, toCoordinator),
  }
}

/** Valid items are kept, broken ones dropped. An empty list is valid ("no events"). */
export function parseEventList(body: unknown): EventSummary[] {
  if (!isRecord(body) || !Array.isArray(body.events)) {
    throw new ApiError('parse', 'The server sent an unexpected response.')
  }
  const items = body.events.map(toEventSummary).filter((e): e is EventSummary => e !== null)
  if (body.events.length > 0 && items.length === 0) {
    throw new ApiError('parse', 'The event data could not be read.')
  }
  return items
}

export function parseEventDetail(body: unknown): EventDetail {
  const detail = isRecord(body) ? toEventDetail(body.event) : null
  if (!detail) throw new ApiError('parse', 'The event data could not be read.')
  return detail
}
