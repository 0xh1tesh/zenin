import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { EventSummary } from '../../types'
import { formatMonth, monthKey } from '../../lib/format'
import { afterFirstInteraction, loadFlip, useReducedMotion } from '../../lib/motion'
import EventCard from '../EventCard'
import type { SortKey, ViewMode } from './useEventFilters'
import './events.css'

export const PAGE_SIZE = 12

interface EventResultsProps {
  events: EventSummary[]
  view: ViewMode
  sort: SortKey
  /** Changes whenever filters/sort change: resets pagination to the first batch. */
  resetKey: string
}

interface Group {
  key: string
  label: string | null
  items: EventSummary[]
}

type FlipApi = Awaited<ReturnType<typeof loadFlip>>
type FlipState = ReturnType<FlipApi['getState']>

function groupByMonth(items: EventSummary[], sort: SortKey): Group[] {
  if (sort !== 'soonest') return [{ key: 'all', label: null, items }]
  const groups: Group[] = []
  for (const item of items) {
    const key = monthKey(item.schedule_summary.start_date)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(item)
    else groups.push({ key, label: formatMonth(key), items: [item] })
  }
  return groups
}

export default function EventResults({ events, view, sort, resetKey }: EventResultsProps) {
  const [shown, setShown] = useState(PAGE_SIZE)
  const [seenKey, setSeenKey] = useState(resetKey)
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const flipRef = useRef<FlipApi | null>(null)
  const stateRef = useRef<FlipState | null>(null)
  const animatingRef = useRef(false)

  // Filters changed: back to the first batch (adjusting state during render is the documented pattern).
  if (seenKey !== resetKey) {
    setSeenKey(resetKey)
    setShown(PAGE_SIZE)
  }

  const visible = useMemo(() => events.slice(0, shown), [events, shown])
  const groups = useMemo(() => groupByMonth(visible, sort), [visible, sort])
  const remaining = events.length - visible.length

  // Load GSAP Flip after first paint; if it never loads, results simply don't animate.
  useEffect(() => {
    if (reduced) return undefined
    let live = true
    const load = () => {
      loadFlip()
        .then((flip) => {
          if (live) flipRef.current = flip
        })
        .catch(() => undefined)
    }
    // Filter transitions only matter once the visitor starts interacting.
    const cancelWait = afterFirstInteraction(load)
    return () => {
      live = false
      cancelWait()
    }
  }, [reduced])

  // FLIP: animate surviving cards from their previous position to the new layout.
  useLayoutEffect(() => {
    const flip = flipRef.current
    const root = rootRef.current
    if (!flip || !root || reduced) return
    const items = root.querySelectorAll<HTMLElement>('[data-flip-id]')
    const previous = stateRef.current
    if (previous && items.length > 0) {
      animatingRef.current = true
      flip.from(previous, {
        targets: items,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          animatingRef.current = false
          stateRef.current = flip.getState(root.querySelectorAll('[data-flip-id]'))
        },
      })
    }
  })

  // Record the settled layout (never mid-animation) for the next transition.
  useEffect(() => {
    const flip = flipRef.current
    const root = rootRef.current
    if (!flip || !root || reduced || animatingRef.current) return
    stateRef.current = flip.getState(root.querySelectorAll('[data-flip-id]'))
  })

  // Auto-load the next batch when the sentinel approaches the viewport.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || remaining <= 0 || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setShown((n) => n + PAGE_SIZE)
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [remaining, shown])

  let cardIndex = 0

  return (
    <div className="events-results" ref={rootRef}>
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label ?? 'Events'}>
          {group.label && (
            <h2 className="events-month">
              <span>{group.label}</span>
              <span className="events-month__count">{group.items.length}</span>
            </h2>
          )}
          <div className={view === 'list' ? 'events-list' : 'ecard-grid'}>
            {group.items.map((event) => {
              const index = cardIndex++
              return (
                <div key={event.id} data-flip-id={event.id} className="events-cell">
                  <EventCard
                    event={event}
                    variant={view === 'list' ? 'compact' : 'default'}
                    index={index % PAGE_SIZE}
                    priority={index === 0}
                  />
                </div>
              )
            })}
          </div>
        </section>
      ))}

      <div className="events-more">
        <p className="events-more__text" aria-live="polite">
          Showing {visible.length} of {events.length} events
        </p>
        {remaining > 0 && (
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setShown((n) => n + PAGE_SIZE)}>
              Load {Math.min(PAGE_SIZE, remaining)} more
            </button>
            <div ref={sentinelRef} className="events-sentinel" aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  )
}
