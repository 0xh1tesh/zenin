/**
 * STUB — shell worker owns this file.
 * Provides minimal type-compatible implementation so tsc passes during parallel build.
 */
import { Link } from 'react-router-dom'
import type { EventSummary } from '../types'

interface EventCardProps {
  event: EventSummary
  variant?: 'default' | 'feature' | 'compact'
  index?: number
}

export default function EventCard({ event, variant = 'default', index: _index }: EventCardProps) {
  return (
    <article className={`event-card event-card--${variant}`} style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--card)' }}>
      <Link to={`/events/${event.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <img
          src={event.cover_image_url}
          alt={event.cover_image_alt}
          width={600}
          height={400}
          loading="lazy"
          style={{ width: '100%', aspectRatio: '3/2', objectFit: 'cover' }}
        />
        <div style={{ padding: '1rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)', marginBottom: '0.25rem' }}>
            {event.category}
          </p>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step-1)', marginBottom: '0.5rem' }}>{event.name}</h3>
          <p style={{ color: 'var(--ink-2)', fontSize: 'var(--step--1)' }}>{event.blurb}</p>
        </div>
      </Link>
    </article>
  )
}
