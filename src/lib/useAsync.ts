import { useCallback, useEffect, useState } from 'react'
import { ApiError, fetchEvent, fetchEvents } from './api'
import type { EventDetail, EventSummary } from '../types'

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'success'; data: T; stale: boolean }

function useLoader<T>(load: (signal: AbortSignal) => Promise<{ data: T; stale: boolean }>, key: string) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: 'loading' })
    load(ctrl.signal)
      .then(({ data, stale }) => setState({ status: 'success', data, stale }))
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return
        setState({
          status: 'error',
          error: err instanceof ApiError ? err : new ApiError('network', 'Something went wrong.'),
        })
      })
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { state, retry }
}

export function useEvents() {
  return useLoader<EventSummary[]>((s) => fetchEvents(s), 'events')
}

export function useEvent(id: string | undefined) {
  return useLoader<EventDetail>((s) => fetchEvent(id ?? '', s), `event:${id}`)
}
