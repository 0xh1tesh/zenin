import React from 'react'
import './ui.css'

/* ----------------------------------------------------------
   Skeleton — generic shimmer block
   ---------------------------------------------------------- */
interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`ui-skeleton ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  )
}

/* ----------------------------------------------------------
   EventCardSkeleton — mirrors EventCard layout (ticket-stub)
   ---------------------------------------------------------- */
export function EventCardSkeleton() {
  return (
    <article className="ui-card-skeleton" aria-hidden="true" aria-label="Loading event">
      {/* Cover image area */}
      <Skeleton className="ui-card-skeleton__image" />
      {/* Body */}
      <div className="ui-card-skeleton__body">
        <Skeleton className="ui-card-skeleton__category" />
        <Skeleton className="ui-card-skeleton__title" />
        <Skeleton className="ui-card-skeleton__title ui-card-skeleton__title--short" />
        <Skeleton className="ui-card-skeleton__blurb" />
        <div className="ui-card-skeleton__meta">
          <Skeleton className="ui-card-skeleton__badge" />
          <Skeleton className="ui-card-skeleton__price" />
        </div>
        {/* Perforation divider */}
        <div className="ui-card-skeleton__perf" />
        <div className="ui-card-skeleton__footer">
          <Skeleton className="ui-card-skeleton__date" />
          <Skeleton className="ui-card-skeleton__seats" />
        </div>
      </div>
    </article>
  )
}
