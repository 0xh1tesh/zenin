import { Link } from 'react-router-dom'
import type { EventDetail, EventSummary } from '../../types'
import { formatDate } from '../../lib/format'
import EventCard from '../EventCard'
import { getPrevNextEvents, getRelatedEvents } from './helpers'
import './detail-sections.css'

interface RelatedEventsProps {
  currentEvent: EventDetail | EventSummary
  allEvents: EventSummary[]
}

export default function RelatedEvents({ currentEvent, allEvents }: RelatedEventsProps) {
  if (!allEvents || allEvents.length === 0) return null

  const { prev, next } = getPrevNextEvents(currentEvent, allEvents)
  const related = getRelatedEvents(currentEvent, allEvents, 3)

  return (
    <>
      {(prev || next) && (
        <nav className="detail-prevnext" aria-label="Timeline navigation">
          {prev ? (
            <Link
              to={`/events/${prev.id}`}
              className="detail-prevnext__link detail-prevnext__link--prev"
            >
              <span className="detail-prevnext__dir">← Earlier Event</span>
              <span className="detail-prevnext__name">{prev.name}</span>
              <span className="detail-prevnext__date">
                {formatDate(prev.schedule_summary.start_date, { month: 'short', day: 'numeric' })}
              </span>
            </Link>
          ) : (
            <div aria-hidden="true" />
          )}

          {next && (
            <Link
              to={`/events/${next.id}`}
              className="detail-prevnext__link detail-prevnext__link--next"
            >
              <span className="detail-prevnext__dir">Later Event →</span>
              <span className="detail-prevnext__name">{next.name}</span>
              <span className="detail-prevnext__date">
                {formatDate(next.schedule_summary.start_date, { month: 'short', day: 'numeric' })}
              </span>
            </Link>
          )}
        </nav>
      )}

      {related.length > 0 && (
        <section className="detail-related" aria-labelledby="related-heading">
          <h3 id="related-heading" className="detail-related__title">
            Related in {currentEvent.category} &amp; Festival Programme
          </h3>
          <div className="detail-related__grid">
            {related.map((ev) => (
              <EventCard key={ev.id} event={ev} variant="compact" />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
