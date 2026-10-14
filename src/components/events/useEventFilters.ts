/**
 * useEventFilters — all filter state lives in URL search params.
 * Shareable URLs, deep-linkable from the Home page.
 *
 * Params:
 *   q      — free-text search (name, blurb, tags)
 *   kind   — 'technical' | 'cultural'
 *   type   — 'event' | 'workshop'
 *   mode   — 'online' | 'offline'
 *   price  — 'free' | 'paid'
 *   open   — '1' = open registration only
 *   past   — '1' = include completed/closed events
 *   sort   — 'soonest' | 'price-asc' | 'seats' | 'deadline'
 *   view   — 'grid' | 'list'
 */
import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { EventSummary } from '../../types'
import { istDate, seatsLeft } from '../../lib/format'

export type SortKey = 'soonest' | 'price-asc' | 'seats' | 'deadline'
export type KindFilter = 'technical' | 'cultural' | ''
export type TypeFilter = 'event' | 'workshop' | ''
export type ModeFilter = 'online' | 'offline' | ''
export type PriceFilter = 'free' | 'paid' | ''
export type ViewMode = 'grid' | 'list'

export interface EventFilters {
  q: string
  kind: KindFilter
  type: TypeFilter
  mode: ModeFilter
  price: PriceFilter
  open: boolean
  past: boolean
  sort: SortKey
  view: ViewMode
}

// Allowed values for validation — prevents arbitrary URL values from passing through
const VALID_KINDS: readonly string[] = ['technical', 'cultural']
const VALID_TYPES: readonly string[] = ['event', 'workshop']
const VALID_MODES: readonly string[] = ['online', 'offline']
const VALID_PRICES: readonly string[] = ['free', 'paid']
const VALID_SORTS: readonly string[] = ['soonest', 'price-asc', 'seats', 'deadline']

function validateEnum<T extends string>(
  value: string | null,
  allowed: readonly string[],
  fallback: T,
): T {
  if (value !== null && allowed.includes(value)) return value as T
  return fallback
}

function read(params: URLSearchParams): EventFilters {
  return {
    q: params.get('q') ?? '',
    kind: validateEnum<KindFilter>(params.get('kind'), VALID_KINDS, ''),
    type: validateEnum<TypeFilter>(params.get('type'), VALID_TYPES, ''),
    mode: validateEnum<ModeFilter>(params.get('mode'), VALID_MODES, ''),
    price: validateEnum<PriceFilter>(params.get('price'), VALID_PRICES, ''),
    open: params.get('open') === '1',
    past: params.get('past') === '1',
    sort: validateEnum<SortKey>(params.get('sort'), VALID_SORTS, 'soonest'),
    view: params.get('view') === 'list' ? 'list' : 'grid',
  }
}

export function useEventFilters() {
  const [params, setParams] = useSearchParams()
  const filters = read(params)

  const setFilter = useCallback(
    (updates: Partial<EventFilters>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const merged = { ...read(prev), ...updates }

          merged.q ? next.set('q', merged.q) : next.delete('q')
          merged.kind ? next.set('kind', merged.kind) : next.delete('kind')
          merged.type ? next.set('type', merged.type) : next.delete('type')
          merged.mode ? next.set('mode', merged.mode) : next.delete('mode')
          merged.price ? next.set('price', merged.price) : next.delete('price')
          merged.open ? next.set('open', '1') : next.delete('open')
          merged.past ? next.set('past', '1') : next.delete('past')
          merged.sort !== 'soonest' ? next.set('sort', merged.sort) : next.delete('sort')
          merged.view !== 'grid' ? next.set('view', merged.view) : next.delete('view')

          return next
        },
        { replace: true }
      )
    },
    [setParams]
  )

  const clearAll = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true })
  }, [setParams])

  return { filters, setFilter, clearAll }
}

/* ─── Filtering & sorting logic ─────────────────────────────────────────── */

function matchesSearch(event: EventSummary, q: string): boolean {
  if (!q) return true
  const needle = q.toLowerCase()
  return (
    event.name.toLowerCase().includes(needle) ||
    event.blurb.toLowerCase().includes(needle) ||
    event.tags.some((t) => t.toLowerCase().includes(needle))
  )
}

export function applyFilters(events: EventSummary[], filters: EventFilters): EventSummary[] {
  let out = events.filter((e) => {
    // Archive: hide completed/closed unless past=true
    if (!filters.past && (e.event_status === 'COMPLETED' || e.event_status === 'CLOSED')) {
      return false
    }
    if (!matchesSearch(e, filters.q)) return false
    if (filters.kind === 'technical' && !e.is_technical) return false
    if (filters.kind === 'cultural' && e.is_technical) return false
    if (filters.type === 'event' && e.event_type !== 'EVENT') return false
    if (filters.type === 'workshop' && e.event_type !== 'WORKSHOP') return false
    if (filters.mode === 'online' && e.event_mode !== 'ONLINE') return false
    if (filters.mode === 'offline' && e.event_mode !== 'OFFLINE') return false
    if (filters.price === 'free' && e.price !== 0) return false
    if (filters.price === 'paid' && e.price === 0) return false
    if (filters.open && e.registration_status !== 'OPEN') return false
    return true
  })

  out = [...out].sort((a, b) => {
    switch (filters.sort) {
      case 'price-asc':
        return a.price - b.price || istDate(a.schedule_summary.start_date).getTime() - istDate(b.schedule_summary.start_date).getTime()
      case 'seats':
        return seatsLeft(b) - seatsLeft(a)
      case 'deadline':
        return new Date(a.registration_deadline).getTime() - new Date(b.registration_deadline).getTime()
      case 'soonest':
      default:
        return istDate(a.schedule_summary.start_date).getTime() - istDate(b.schedule_summary.start_date).getTime()
    }
  })

  return out
}

/** Returns active filter chips (label + clear callback) */
export interface FilterChip {
  key: string
  label: string
}

export function getActiveChips(filters: EventFilters): FilterChip[] {
  const chips: FilterChip[] = []
  if (filters.q) chips.push({ key: 'q', label: `"${filters.q}"` })
  // FIX: cultural chip must use key 'kind' (same as technical) so removeChip({ kind: '' }) clears it
  if (filters.kind === 'technical') chips.push({ key: 'kind', label: 'Technical' })
  if (filters.kind === 'cultural') chips.push({ key: 'kind', label: 'Cultural' })
  if (filters.type === 'event') chips.push({ key: 'type', label: 'Events' })
  if (filters.type === 'workshop') chips.push({ key: 'type', label: 'Workshops' })
  if (filters.mode === 'online') chips.push({ key: 'mode', label: 'Online' })
  if (filters.mode === 'offline') chips.push({ key: 'mode', label: 'Offline' })
  if (filters.price === 'free') chips.push({ key: 'price', label: 'Free' })
  if (filters.price === 'paid') chips.push({ key: 'price', label: 'Paid' })
  if (filters.open) chips.push({ key: 'open', label: 'Open Registration' })
  if (filters.past) chips.push({ key: 'past', label: 'Include Archive' })
  return chips
}
