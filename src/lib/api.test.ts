import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EventSummary } from '../types'

const event = (id = 'evt-1') => ({
  id,
  name: 'Orbit Hack',
  blurb: 'A hackathon',
  cover_image_url: '',
  cover_image_alt: '',
  category: 'Hackathon',
  tags: [],
  event_type: 'EVENT',
  event_mode: 'OFFLINE',
  event_status: 'ACTIVE',
  is_featured: false,
  is_technical: true,
  price: 0,
  is_per_head: true,
  min_teamsize: 1,
  max_teamsize: 1,
  total_seats: 10,
  seats_filled: 1,
  registration_status: 'OPEN',
  registration_deadline: '2026-11-10T18:00:00+05:30',
  schedule_summary: { start_date: '2026-11-13', start_time: '18:00', end_date: '2026-11-13', end_time: '20:00' },
})

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

type Handler = (url: string) => Response | Promise<Response>

function mockFetch(handler: Handler) {
  const fn = vi.fn((input: RequestInfo | URL) => Promise.resolve(handler(String(input))))
  vi.stubGlobal('fetch', fn)
  return fn
}

/** Fresh module state (memory cache, in-flight map, snapshot promise) for every test. */
async function load() {
  vi.resetModules()
  return import('./api')
}

describe('api client', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('loads events from the network and then serves them from the fresh cache', async () => {
    const fetchFn = mockFetch(() => json({ events: [event()] }))
    const api = await load()

    const first = await api.fetchEvents()
    expect(first.source).toBe('network')
    expect(first.data).toHaveLength(1)

    const second = await api.fetchEvents()
    expect(second.source).toBe('cache')
    expect(second.stale).toBe(false)
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('retries a 500 and succeeds on the next attempt, reporting each attempt', async () => {
    let calls = 0
    mockFetch(() => (++calls < 3 ? json({}, 500) : json({ events: [event()] })))
    const api = await load()
    const attempts: number[] = []

    const promise = api.fetchEvents({ onAttempt: (a) => attempts.push(a.n) })
    await vi.advanceTimersByTimeAsync(4000)
    const result = await promise

    expect(result.source).toBe('network')
    expect(attempts).toEqual([1, 2, 3])
  })

  it('gives up after three attempts when there is no cache or snapshot', async () => {
    const fetchFn = mockFetch(() => json({}, 500))
    const api = await load()

    const promise = api.fetchEvents()
    const assertion = expect(promise).rejects.toMatchObject({ kind: 'server' })
    await vi.advanceTimersByTimeAsync(4000)
    await assertion

    const listCalls = fetchFn.mock.calls.filter(([u]) => String(u).endsWith('/events')).length
    expect(listCalls).toBe(api.MAX_ATTEMPTS)
  })

  it('does not retry a 404 on a detail request', async () => {
    const fetchFn = mockFetch(() => json({ error: 'not_found' }, 404))
    const api = await load()

    await expect(api.fetchEvent('missing')).rejects.toMatchObject({ kind: 'not_found' })
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('serves a stale cached copy when the network fails after the freshness window', async () => {
    let healthy = true
    mockFetch(() => (healthy ? json({ events: [event()] }) : json({}, 503)))
    const api = await load()

    await api.fetchEvents()
    healthy = false
    vi.setSystemTime(Date.now() + api.FRESH_MS + 1000)

    const promise = api.fetchEvents()
    await vi.advanceTimersByTimeAsync(4000)
    const result = await promise

    expect(result.source).toBe('cache')
    expect(result.stale).toBe(true)
    expect(result.data[0].id).toBe('evt-1')
  })

  it('falls back to the bundled offline snapshot for first-time visitors', async () => {
    mockFetch((url) =>
      url.endsWith('/events-snapshot.json')
        ? json({ generated_at: '2026-10-01T00:00:00Z', events: [event('snap-1')], details: {} })
        : json({}, 500),
    )
    const api = await load()

    const promise = api.fetchEvents()
    await vi.advanceTimersByTimeAsync(4000)
    const result = await promise

    expect(result.source).toBe('snapshot')
    expect(result.stale).toBe(true)
    expect((result.data as EventSummary[])[0].id).toBe('snap-1')
  })

  it('treats an empty list as a valid result, not an error', async () => {
    mockFetch(() => json({ events: [] }))
    const api = await load()
    const result = await api.fetchEvents()
    expect(result.data).toEqual([])
    expect(result.source).toBe('network')
  })

  it('reports an unreadable body as a parse error without retrying', async () => {
    const fetchFn = mockFetch((url) => (url.endsWith('/events-snapshot.json') ? json({}, 404) : json({ wrong: true })))
    const api = await load()

    await expect(api.fetchEvents()).rejects.toMatchObject({ kind: 'parse' })
    const listCalls = fetchFn.mock.calls.filter(([u]) => String(u).endsWith('/api/test/events')).length
    expect(listCalls).toBe(1)
  })

  it('shares a single in-flight request between concurrent callers', async () => {
    const fetchFn = mockFetch(() => json({ events: [event()] }))
    const api = await load()

    await Promise.all([api.fetchEvents(), api.fetchEvents(), api.fetchEvents()])
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('simulates failures with ?chaos= for demos', async () => {
    window.history.replaceState({}, '', '/?chaos=500&snapshot=off')
    const fetchFn = mockFetch(() => json({ events: [event()] }))
    const api = await load()

    const promise = api.fetchEvents()
    const assertion = expect(promise).rejects.toMatchObject({ kind: 'server' })
    await vi.advanceTimersByTimeAsync(4000)
    await assertion
    expect(fetchFn).not.toHaveBeenCalled()

    window.history.replaceState({}, '', '/')
  })
})
