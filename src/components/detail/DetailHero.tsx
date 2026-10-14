import { type EventDetail } from '../../types'
import { formatDateRange } from '../../lib/format'

interface DetailHeroProps {
  event: EventDetail
}

export default function DetailHero({ event }: DetailHeroProps) {
  const imageUrl = event.banner_image_url || event.cover_image_url
  const imageAlt = event.banner_image_alt || event.cover_image_alt

  return (
    <section className="detail-hero" aria-label="Event banner">
      <img
        src={imageUrl}
        alt={imageAlt}
        className="detail-hero__img"
        width={1200}
        height={514}
        fetchPriority="high"
        decoding="async"
      />
      <div className="detail-hero__overlay" aria-hidden="true" />
      <div className="detail-hero__content">
        <div className="detail-hero__meta">
          <span className="detail-hero__category" aria-label={`Category: ${event.category}`}>
            {event.category}
          </span>
          {event.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="detail-hero__tag">
              {tag}
            </span>
          ))}
        </div>
        <h1 className="detail-hero__title">{event.name}</h1>
        <div className="detail-hero__sub">
          <span className="detail-hero__date mono">
            {formatDateRange(event)}
          </span>
          <span className="detail-hero__date mono">
            {event.event_mode === 'ONLINE' ? '🌐 Online' : '📍 Offline'}
          </span>
        </div>
      </div>
    </section>
  )
}
