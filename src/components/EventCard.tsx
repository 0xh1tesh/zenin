import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { EventSummary } from '../types'
import { prefetchEvent } from '../lib/api'
import { cx } from '../lib/cx'
import { formatDate, formatDateRange } from '../lib/format'
import { responsiveImage } from '../lib/image'
import PriceTag from './ui/PriceTag'
import SeatsMeter from './ui/SeatsMeter'
import Stamp from './ui/Stamp'
import StatusBadge, { registrationState } from './ui/StatusBadge'
import './EventCard.css'

export type EventCardVariant = 'default' | 'feature' | 'compact'

interface EventCardProps {
  event: EventSummary
  variant?: EventCardVariant
  /** Position in the list; drives the staggered reveal delay. */
  index?: number
  /** Marks the one above-the-fold image: eager + high fetch priority. */
  priority?: boolean
}

const IMAGE_SPECS = {
  default: { widths: [400, 640, 960], ratio: 3 / 2, sizes: '(min-width: 1280px) 22rem, (min-width: 640px) 33vw, 100vw' },
  feature: { widths: [640, 960, 1280], ratio: 3 / 2, sizes: '(min-width: 760px) 50vw, 100vw' },
  compact: { widths: [160, 240], ratio: 1, sizes: '6rem' },
} as const

export default function EventCard({ event, variant = 'default', index = 0, priority = false }: EventCardProps) {
  const spec = IMAGE_SPECS[variant]
  const image = responsiveImage(event.cover_image_url, spec)
  const state = registrationState(event)
  const archived = event.event_status !== 'ACTIVE'
  const showStamp = state.tone !== 'open'
  const { start_date } = event.schedule_summary
  const warm = () => prefetchEvent(event.id)

  return (
    <article
      className={cx('ecard', `ecard--${variant}`, archived && 'is-archived')}
      style={{ '--i': Math.min(index, 12) } as CSSProperties}
    >
      <Link className="ecard__link" to={`/events/${event.id}`} onPointerEnter={warm} onFocus={warm}>
        <div className="ecard__media">
          {image ? (
            <img
              src={image.src}
              srcSet={image.srcSet}
              sizes={image.sizes}
              width={image.width}
              height={image.height}
              alt={event.cover_image_alt}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : undefined}
              decoding="async"
            />
          ) : (
            <div className="ecard__placeholder" aria-hidden="true" />
          )}
          {variant !== 'compact' && (
            <>
              <span className="ecard__date" aria-hidden="true">
                <span className="ecard__date-month">{formatDate(start_date, { month: 'short' })}</span>
                <span className="ecard__date-day">{formatDate(start_date, { day: '2-digit' })}</span>
              </span>
              <span className="ecard__badge">
                <StatusBadge event={event} />
              </span>
              {showStamp && (
                <span className="ecard__stamp">
                  <Stamp tone={state.tone === 'open' ? 'closed' : state.tone}>{state.label}</Stamp>
                </span>
              )}
            </>
          )}
        </div>

        <div className="ecard__body">
          <p className="ecard__cat">
            {event.category} · {event.event_type === 'WORKSHOP' ? 'Workshop' : 'Event'}
            {event.event_mode === 'ONLINE' ? ' · Online' : ''}
          </p>
          <h3 className="ecard__title">{event.name}</h3>
          {variant !== 'compact' && <p className="ecard__blurb">{event.blurb}</p>}
          <p className="ecard__when">{formatDateRange(event)}</p>
          <div className="ecard__foot">
            <PriceTag event={event} />
            {variant !== 'compact' && <SeatsMeter event={event} />}
          </div>
        </div>
      </Link>
    </article>
  )
}
