import { useCallback, useEffect, useState } from 'react'
import {
  fetchEvent,
  fetchEvents,
  peekEvent,
  peekEvents,
  peekSummary,
  type Attempt,
  type FetchOptions,
  type Loaded,
  type Source,
} from './api'
import { ApiError, toApiError } from './errors'
import type { EventDetail, EventSummary } from '../types'

export type AsyncState<T> =
  | { status: 'loading'; attempt: Attempt | null }
  | { status: 'error'; error: ApiError }
  | {
      status: 'success'
      data: T
      /** Data is older than the freshness window or came from a fallback. */
      stale: boolean
      source: Source
      fetchedAt: number
      /** A background refresh is running while `data` is already shown. */
      isRevalidating: boolean
    }

function success<T>(loaded: Loaded<T>, isRevalidating: boolean): AsyncState<T> {
  return {
    status: 'success',
    data: loaded.data,
    // While a background refresh is running the data is not "stale" to the visitor yet;
    // the notice only appears if that refresh fails (see the catch below).
    stale: loaded.stale && !isRevalidating,
    source: loaded.source,
    fetchedAt: loaded.fetchedAt,
    isRevalidating,
  }
}

function initialState<T>(cached: Loaded<T> | null): AsyncState<T> {
  return cached ? success(cached, cached.stale) : { status: 'loading', attempt: null }
}

/**
 * Stale-while-revalidate loader. Cached data renders instantly; a stale copy is
 * refreshed in the background; a failed refresh keeps the old data and flags it stale.
 */
function useResource<T>(
  key: string,
  peek: () => Loaded<T> | null,
  load: (opts: FetchOptions) => Promise<Loaded<T>>,
) {
  const [state, setState] = useState<AsyncState<T>>(() => initialState(peek()))
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    const cached = peek()
    setState(initialState(cached))
    if (cached && !cached.stale && attempt === 0) return undefined

    load({
      force: attempt > 0,
      onAttempt: (a) => {
        if (cancelled || cached) return
        setState((prev) => (prev.status === 'loading' ? { status: 'loading', attempt: a } : prev))
      },
    })
      .then((loaded) => {
        if (!cancelled) setState(success(loaded, false))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setState((prev) =>
          prev.status === 'success'
            ? { ...prev, stale: true, isRevalidating: false }
            : { status: 'error', error: toApiError(err) },
        )
      })
    return () => {
      cancelled = true
    }
    // peek/load are stable per key by construction
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading', attempt: null })
    setAttempt((n) => n + 1)
  }, [])

  return { state, retry }
}

export function useEvents() {
  return useResource<EventSummary[]>('events', peekEvents, fetchEvents)
}

export function useEvent(id: string | undefined) {
  const eventId = id ?? ''
  const resource = useResource<EventDetail>(
    `event:${eventId}`,
    () => (eventId ? peekEvent(eventId) : null),
    (opts) => fetchEvent(eventId, opts),
  )
  /** Summary from the cached list, usable for an instant skeleton-free header. */
  const summary = eventId ? peekSummary(eventId) : null
  return { ...resource, summary }
}
