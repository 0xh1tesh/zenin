import { Link } from 'react-router-dom'
import type { EventSummary } from '../../types'
import { formatDeadline, daysUntil } from '../../lib/format'
import { Skeleton } from '../ui/Skeleton'

interface ClosingSoonStripProps {
  events: EventSummary[]
}

interface CountdownProps {
  deadline: string
}

function DaysChip({ deadline }: CountdownProps) {
  const days = daysUntil(deadline)
  if (days < 0) return null

  const label = days === 0 ? 'Today!' : days === 1 ? '1 day left' : `${days} days`
  const cls =
    days <= 1
      ? 'home-closing-card__countdown home-closing-card__countdown--critical'
      : days <= 3
        ? 'home-closing-card__countdown home-closing-card__countdown--urgent'
        : 'home-closing-card__countdown'

  return (
    <span className={cls} aria-label={`${label} until registration closes`}>
      {days === 0 ? 'Today!' : (
        <>
          {days}
          <span className="home-closing-card__countdown-colon" aria-hidden="true">d</span>
          {' left'}
        </>
      )}
    </span>
  )
}

export default function ClosingSoonStrip({ events }: ClosingSoonStripProps) {
  // Filter open registrations, sort by deadline
  const closing = events
    .filter((e) => e.registration_status === 'OPEN' && e.event_status === 'ACTIVE')
    .filter((e) => daysUntil(e.registration_deadline) >= 0)
    .sort(
      (a, b) =>
        new Date(a.registration_deadline).getTime() -
        new Date(b.registration_deadline).getTime(),
    )
    .slice(0, 6)

  if (closing.length === 0) return null

  return (
    <section className="home-closing" aria-label="Closing soon registrations">
      <div className="home-closing__inner">
        <div className="home-closing__header">
          <h2 className="home-closing__title">Closing soon</h2>
          <Link to="/events?registration=open" className="home-closing__all">
            All open →
          </Link>
        </div>

        <ul className="home-closing__list" role="list" aria-label="Registrations closing soon">
          {closing.map((event) => (
            <li key={event.id} role="listitem">
              <Link
                to={`/events/${event.id}`}
                className="home-closing-card"
                aria-label={`${event.name}, deadline ${formatDeadline(event.registration_deadline)}`}
              >
                <DaysChip deadline={event.registration_deadline} />
                <span className="home-closing-card__category mono">
                  {event.category}
                </span>
                <span className="home-closing-card__name">{event.name}</span>
                <span className="home-closing-card__deadline">
                  Closes {formatDeadline(event.registration_deadline)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function ClosingSoonSkeleton() {
  return (
    <section className="home-closing" aria-label="Loading closing soon" aria-busy="true">
      <div className="home-closing__inner">
        <div className="home-closing__header">
          <div className="home-closing__title">Closing soon</div>
        </div>
        <ul className="home-closing__skel-list" role="list" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="home-closing__skel-card">
              <Skeleton style={{ width: '60%', height: '0.7rem', background: '#ffffff20' }} />
              <Skeleton style={{ width: '85%', height: '1.1rem', background: '#ffffff30' }} />
              <Skeleton style={{ width: '50%', height: '0.7rem', background: '#ffffff15' }} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
