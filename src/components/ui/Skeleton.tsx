import type { CSSProperties } from 'react'
import type { Attempt } from '../../lib/api'
import { cx } from '../../lib/cx'
import './ui.css'

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cx('ui-skeleton', className)} style={style} aria-hidden="true" />
}

/** Mirrors the default EventCard layout so nothing shifts when data arrives. */
export function EventCardSkeleton() {
  return (
    <div className="ecard-skel" aria-hidden="true">
      <Skeleton className="ecard-skel__media" />
      <div className="ecard-skel__body">
        <Skeleton className="ecard-skel__line ecard-skel__line--short" />
        <Skeleton className="ecard-skel__line ecard-skel__line--title" />
        <Skeleton className="ecard-skel__line" />
        <div className="ecard-skel__foot">
          <Skeleton className="ecard-skel__line ecard-skel__line--short" />
          <Skeleton className="ecard-skel__line ecard-skel__line--short" />
        </div>
      </div>
    </div>
  )
}

export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="ecard-grid" role="status" aria-label="Loading events">
      {Array.from({ length: count }, (_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Visible only after the first attempt fails: tells the visitor we are retrying. */
export function RetryNote({ attempt }: { attempt: Attempt | null }) {
  if (!attempt || attempt.n < 2) return null
  return (
    <p className="ui-retry-note" role="status">
      Signal weak, retrying {attempt.n}/{attempt.max}…
    </p>
  )
}
