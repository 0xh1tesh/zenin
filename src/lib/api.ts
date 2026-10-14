import type { EventDetail, EventSummary } from '../types'

const BASE = 'https://render72.pages.dev/api/test'
const TIMEOUT_MS = 8000
const LIST_KEY = 'k26:events:v1'
const detailKey = (id: string) => `k26:event:${id}:v1`

export type ApiErrorKind = 'not_found' | 'network' | 'timeout' | 'server' | 'parse'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort('timeout'), TIMEOUT_MS)
  const onAbort = () => ctrl.abort('aborted')
  signal?.addEventListener('abort', onAbort)
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    })
    if (res.status === 404) throw new ApiError('not_found', 'Event not found.', 404)
    if (!res.ok) throw new ApiError('server', `Server responded ${res.status}.`, res.status)
    try {
      return (await res.json()) as T
    } catch {
      throw new ApiError('parse', 'The server sent an unreadable response.')
    }
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (ctrl.signal.aborted && ctrl.signal.reason === 'timeout') {
      throw new ApiError('timeout', 'The request took too long.')
    }
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError('network', 'Could not reach the server.')
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeCache(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable or full: caching is best-effort */
  }
}

export interface Loaded<T> {
  data: T
  /** true when the network failed and we are showing the last good copy */
  stale: boolean
}

export async function fetchEvents(signal?: AbortSignal): Promise<Loaded<EventSummary[]>> {
  try {
    const body = await request<{ events: EventSummary[] }>('/events', signal)
    writeCache(LIST_KEY, body.events)
    return { data: body.events, stale: false }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    const cached = readCache<EventSummary[]>(LIST_KEY)
    if (cached) return { data: cached, stale: true }
    throw err
  }
}

export async function fetchEvent(id: string, signal?: AbortSignal): Promise<Loaded<EventDetail>> {
  try {
    const body = await request<{ event: EventDetail }>(`/events/${encodeURIComponent(id)}`, signal)
    writeCache(detailKey(id), body.event)
    return { data: body.event, stale: false }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    if (err instanceof ApiError && err.kind === 'not_found') throw err
    const cached = readCache<EventDetail>(detailKey(id))
    if (cached) return { data: cached, stale: true }
    throw err
  }
}
