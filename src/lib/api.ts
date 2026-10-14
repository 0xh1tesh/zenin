import type { EventDetail, EventSummary } from '../types'
import { chaosMode, snapshotDisabled } from './chaos'
import { ApiError, isAbortError, toApiError } from './errors'
import { parseEventDetail, parseEventList, toEventDetail } from './validate'

export { ApiError } from './errors'
export type { ApiErrorKind } from './errors'

export const API_BASE = 'https://render72.pages.dev/api/test'
export const MAX_ATTEMPTS = 3
export const REQUEST_TIMEOUT_MS = 6000
export const FRESH_MS = 5 * 60_000
const BACKOFF_MS = [400, 1200]
const CHAOS_TIMEOUT_MS = 2000
const CACHE_PREFIX = 'z26:v2:'
const SNAPSHOT_URL = '/events-snapshot.json'

export type Source = 'network' | 'cache' | 'snapshot'

export interface Loaded<T> {
  data: T
  /** True when the data is older than the freshness window or came from a fallback. */
  stale: boolean
  source: Source
  fetchedAt: number
}

export interface Attempt {
  n: number
  max: number
}

export interface FetchOptions {
  onAttempt?: (attempt: Attempt) => void
  /** Skip the fresh-cache shortcut and hit the network. */
  force?: boolean
}

/* ─── Cache: memory first, localStorage second (both best-effort) ───────── */

interface Entry<T> {
  at: number
  data: T
}

const memory = new Map<string, Entry<unknown>>()

function readEntry<T>(key: string): Entry<T> | null {
  const hit = memory.get(key)
  if (hit) return hit as Entry<T>
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Entry<T>
    if (typeof parsed?.at !== 'number' || parsed.data === undefined) return null
    memory.set(key, parsed)
    return parsed
  } catch {
    return null
  }
}

function writeEntry<T>(key: string, data: T) {
  const entry: Entry<T> = { at: Date.now(), data }
  memory.set(key, entry)
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch {
    /* storage unavailable or full: caching is best-effort */
  }
}

const isFresh = (at: number) => Date.now() - at <= FRESH_MS

function fromEntry<T>(entry: Entry<T>): Loaded<T> {
  return { data: entry.data, stale: !isFresh(entry.at), source: 'cache', fetchedAt: entry.at }
}

/** Synchronous read for instant first paint. Disabled while chaos mode is on. */
export function peekEvents(): Loaded<EventSummary[]> | null {
  if (chaosMode()) return null
  const entry = readEntry<EventSummary[]>('list')
  return entry ? fromEntry(entry) : null
}

export function peekEvent(id: string): Loaded<EventDetail> | null {
  if (chaosMode()) return null
  const entry = readEntry<EventDetail>(`event:${id}`)
  return entry ? fromEntry(entry) : null
}

/** Summary for an event from the cached list, if the list has been loaded before. */
export function peekSummary(id: string): EventSummary | null {
  const list = readEntry<EventSummary[]>('list')
  return list?.data.find((e) => e.id === id) ?? null
}

/* ─── Network with timeout + retry/backoff ──────────────────────────────── */

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function attemptOnce(path: string): Promise<unknown> {
  const chaos = chaosMode()
  if (chaos === 'offline') {
    await sleep(150)
    throw new ApiError('network', 'Could not reach the server.')
  }
  if (chaos === '500') {
    await sleep(150)
    throw new ApiError('server', 'Server responded 500.', 500)
  }
  if (chaos === 'timeout') {
    await sleep(CHAOS_TIMEOUT_MS)
    throw new ApiError('timeout', 'The request took too long.')
  }
  if (chaos === 'malformed') return { unexpected: true }
  if (chaos === 'empty') {
    if (path === '/events') return { events: [] }
    throw new ApiError('not_found', 'Event not found.', 404)
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(API_BASE + path, { signal: ctrl.signal })
    if (res.status === 404) throw new ApiError('not_found', 'Event not found.', 404)
    if (!res.ok) throw new ApiError('server', `Server responded ${res.status}.`, res.status)
    try {
      return await res.json()
    } catch {
      throw new ApiError('parse', 'The server sent an unreadable response.')
    }
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (ctrl.signal.aborted) throw new ApiError('timeout', 'The request took too long.')
    throw new ApiError('network', 'Could not reach the server.')
  } finally {
    clearTimeout(timer)
  }
}

const backoffDelay = (attempt: number) => BACKOFF_MS[attempt - 1] * (0.75 + Math.random() * 0.5)

async function requestWithRetry(path: string, onAttempt?: (a: Attempt) => void): Promise<unknown> {
  for (let n = 1; ; n++) {
    onAttempt?.({ n, max: MAX_ATTEMPTS })
    try {
      return await attemptOnce(path)
    } catch (err) {
      const apiErr = toApiError(err)
      if (!apiErr.retryable || n >= MAX_ATTEMPTS) throw apiErr
      await sleep(backoffDelay(n))
    }
  }
}

/* ─── Share one in-flight request between components ────────────────────── */

interface Flight {
  promise: Promise<Loaded<unknown>>
  listeners: Set<(a: Attempt) => void>
  last?: Attempt
}

const flights = new Map<string, Flight>()

function runShared<T>(
  key: string,
  run: (onAttempt: (a: Attempt) => void) => Promise<Loaded<T>>,
  onAttempt?: (a: Attempt) => void,
): Promise<Loaded<T>> {
  let flight = flights.get(key)
  if (!flight) {
    const listeners = new Set<(a: Attempt) => void>()
    // Register the flight before running: `run` reports attempt 1 synchronously.
    const created: Flight = { listeners, promise: Promise.resolve() as unknown as Promise<Loaded<unknown>> }
    flights.set(key, created)
    created.promise = run((a) => {
      created.last = a
      listeners.forEach((l) => l(a))
    }).finally(() => flights.delete(key))
    flight = created
  }
  if (onAttempt) {
    flight.listeners.add(onAttempt)
    if (flight.last) onAttempt(flight.last)
  }
  return flight.promise as Promise<Loaded<T>>
}

/* ─── Offline snapshot (last resort for first-time visitors) ────────────── */

interface Snapshot {
  at: number
  events: EventSummary[]
  details: Map<string, EventDetail>
}

let snapshotPromise: Promise<Snapshot | null> | null = null

function loadSnapshot(): Promise<Snapshot | null> {
  if (snapshotDisabled()) return Promise.resolve(null)
  snapshotPromise ??= fetch(SNAPSHOT_URL)
    .then((res) => (res.ok ? res.json() : null))
    .then((body: unknown): Snapshot | null => {
      const rec = body as { generated_at?: string; events?: unknown; details?: Record<string, unknown> } | null
      if (!rec) return null
      const events = parseEventList({ events: rec.events })
      if (events.length === 0) return null
      const details = new Map<string, EventDetail>()
      for (const raw of Object.values(rec.details ?? {})) {
        const detail = toEventDetail(raw)
        if (detail) details.set(detail.id, detail)
      }
      const at = rec.generated_at ? Date.parse(rec.generated_at) : NaN
      return { at: Number.isNaN(at) ? Date.now() : at, events, details }
    })
    .catch(() => null)
  return snapshotPromise
}

/* ─── Public API ────────────────────────────────────────────────────────── */

async function loadList(onAttempt: (a: Attempt) => void): Promise<Loaded<EventSummary[]>> {
  try {
    const data = parseEventList(await requestWithRetry('/events', onAttempt))
    if (!chaosMode()) writeEntry('list', data)
    return { data, stale: false, source: 'network', fetchedAt: Date.now() }
  } catch (err) {
    const cached = readEntry<EventSummary[]>('list')
    if (cached) return { data: cached.data, stale: true, source: 'cache', fetchedAt: cached.at }
    const snapshot = await loadSnapshot()
    if (snapshot) return { data: snapshot.events, stale: true, source: 'snapshot', fetchedAt: snapshot.at }
    throw toApiError(err)
  }
}

export function fetchEvents(opts: FetchOptions = {}): Promise<Loaded<EventSummary[]>> {
  const cached = chaosMode() ? null : readEntry<EventSummary[]>('list')
  if (cached && !opts.force && isFresh(cached.at)) return Promise.resolve(fromEntry(cached))
  return runShared('list', loadList, opts.onAttempt)
}

async function loadDetail(id: string, onAttempt: (a: Attempt) => void): Promise<Loaded<EventDetail>> {
  try {
    const data = parseEventDetail(await requestWithRetry(`/events/${encodeURIComponent(id)}`, onAttempt))
    if (!chaosMode()) writeEntry(`event:${id}`, data)
    return { data, stale: false, source: 'network', fetchedAt: Date.now() }
  } catch (err) {
    const apiErr = toApiError(err)
    if (apiErr.kind === 'not_found') throw apiErr
    const cached = readEntry<EventDetail>(`event:${id}`)
    if (cached) return { data: cached.data, stale: true, source: 'cache', fetchedAt: cached.at }
    const snapshot = await loadSnapshot()
    const fromSnapshot = snapshot?.details.get(id)
    if (snapshot && fromSnapshot) return { data: fromSnapshot, stale: true, source: 'snapshot', fetchedAt: snapshot.at }
    throw apiErr
  }
}

export function fetchEvent(id: string, opts: FetchOptions = {}): Promise<Loaded<EventDetail>> {
  const key = `event:${id}`
  const cached = chaosMode() ? null : readEntry<EventDetail>(key)
  if (cached && !opts.force && isFresh(cached.at)) return Promise.resolve(fromEntry(cached))
  return runShared(key, (onAttempt) => loadDetail(id, onAttempt), opts.onAttempt)
}

const prefetched = new Set<string>()

/** Warm the detail cache on hover/focus so the click feels instant. */
export function prefetchEvent(id: string) {
  if (prefetched.has(id) || chaosMode()) return
  const cached = readEntry<EventDetail>(`event:${id}`)
  if (cached && isFresh(cached.at)) return
  prefetched.add(id)
  fetchEvent(id).catch((err: unknown) => {
    if (!isAbortError(err)) prefetched.delete(id)
  })
}
