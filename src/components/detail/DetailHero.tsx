import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { EventDetail, EventSummary } from '../../types'
import { formatDateRange } from '../../lib/format'
import { responsiveImage } from '../../lib/image'
import StatusBadge from '../ui/StatusBadge'
import './detail-hero.css'

interface DetailHeroProps {
  event: EventDetail | EventSummary
}

export default function DetailHero({ event }: DetailHeroProps) {
  const navigate = useNavigate()

  const imageUrl =
    ('banner_image_url' in event && event.banner_image_url)
      ? event.banner_image_url
      : event.cover_image_url
  const imageAlt =
    ('banner_image_alt' in event && event.banner_image_alt)
      ? event.banner_image_alt
      : event.cover_image_alt

  const image = responsiveImage(imageUrl, {
    widths: [800, 1200, 1920],
    ratio: 16 / 9,
    sizes: '100vw',
  })

  const venue =
    ('schedules' in event && event.schedules[0]?.venue)
      ? event.schedules[0].venue
      : event.event_mode === 'ONLINE'
        ? 'Online'
        : 'Pune Campus'

  const handleBack = (e: MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== 'undefined' && window.history.state && window.history.state.idx > 0) {
      e.preventDefault()
      navigate(-1)
    }
  }

  return (
    <header className="detail-hero" aria-label="Event banner">
      {image && (
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={image.sizes}
          width={image.width}
          height={image.height}
          alt={imageAlt || event.name}
          className="detail-hero__img"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      )}
      <div className="detail-hero__scrim" aria-hidden="true" />
      <div className="detail-hero__content">
        <div className="detail-hero__top-bar">
          <Link to="/events" onClick={handleBack} className="detail-hero__back">
            <span aria-hidden="true">←</span> Back to all events
          </Link>
        </div>

        <div className="detail-hero__eyebrow">
          <span className="detail-hero__category">{event.category}</span>
          {event.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="detail-hero__tag">
              {tag}
            </span>
          ))}
        </div>

        <h1 className="detail-hero__title">{event.name}</h1>

        <div className="detail-hero__sub">
          <StatusBadge event={event} />
          <span className="detail-hero__date">{formatDateRange(event)}</span>
          <span className="detail-hero__venue">
            <svg
              className="detail-hero__venue-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              {event.event_mode === 'ONLINE' ? (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </>
              ) : (
                <>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </>
              )}
            </svg>
            {venue}
          </span>
        </div>
      </div>
    </header>
  )
}
