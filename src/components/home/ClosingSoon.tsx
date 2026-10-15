import { Link } from 'react-router-dom'
import type { EventSummary } from '../../types'
import { getClosingSoonEvents } from './helpers'
import { isWithinHours } from '../ambient/ambientHelpers'
import Caret from '../ambient/Caret'
import Countdown from '../ui/Countdown'
import SeatsMeter from '../ui/SeatsMeter'
import { Skeleton } from '../ui/Skeleton'
import './home.css'

export interface ClosingSoonProps {
  events: EventSummary[] | null
}

export default function ClosingSoon({ events }: ClosingSoonProps) {
  const closingEvents = getClosingSoonEvents(events, 6)

  return (
    <section className="closing section" aria-label="Registration deadlines closing soon">
      <div className="container">
        <div className="closing__header">
          <div>
            <p className="eyebrow closing__eyebrow">
              <span>03 · Closing soon</span>
              <Caret />
            </p>
            <h2 className="closing__heading">Registration window closing</h2>
          </div>
          <Link to="/events?open=1&sort=deadline" className="closing__all-link mono">
            View all open <span aria-hidden="true">→</span>
          </Link>
        </div>

        {events === null ? (
          <div className="closing__list" role="status" aria-label="Loading closing soon events">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="closing-row closing-row--skel">
                <div className="closing-row__main">
                  <Skeleton className="closing-row__cat-skel" />
                  <Skeleton className="closing-row__title-skel" />
                </div>
                <div className="closing-row__meta">
                  <Skeleton className="closing-row__seats-skel" />
                  <Skeleton className="closing-row__timer-skel" />
                </div>
              </div>
            ))}
          </div>
        ) : closingEvents.length === 0 ? (
          <div className="closing__empty">
            <p className="closing__empty-text">All active registration windows are currently satisfied.</p>
            <Link to="/events" className="btn btn--ghost">
              Explore full programme
            </Link>
          </div>
        ) : (
          <ul className="closing__list">
            {closingEvents.map((event) => {
              const isUrgent = isWithinHours(event.registration_deadline, 72)

              return (
                <li key={event.id} className="closing-row">
                  <Link to={`/events/${event.id}`} className="closing-row__link">
                    <div className="closing-row__main">
                      <div className="closing-row__cat-wrap">
                        {isUrgent && (
                          <span
                            className="closing-row__urgent-beacon"
                            title="Closes within 72 hours"
                            aria-label="Closes within 72 hours"
                          >
                            <span className="closing-row__urgent-pulse" aria-hidden="true" />
                            <span className="closing-row__urgent-core" aria-hidden="true" />
                          </span>
                        )}
                        <span className="closing-row__cat mono">{event.category}</span>
                      </div>
                      <h3 className="closing-row__title">{event.name}</h3>
                    </div>

                    <div className="closing-row__meta">
                      <div className="closing-row__seats">
                        <SeatsMeter event={event} />
                      </div>

                      <div className="closing-row__countdown">
                        <span className="closing-row__label mono">Closes in</span>
                        <Countdown to={event.registration_deadline} compact />
                      </div>

                      <div className="closing-row__action" aria-hidden="true">
                        <span className="closing-row__arrow">→</span>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
