import { type EventDetail } from '../../types'
import { formatDate, formatTime } from '../../lib/format'

interface ScheduleSectionProps {
  event: EventDetail
}

export default function ScheduleSection({ event }: ScheduleSectionProps) {
  if (!event.schedules || event.schedules.length === 0) return null

  return (
    <section id="schedule" className="detail-section" aria-labelledby="schedule-heading">
      <h2 id="schedule-heading" className="detail-section__heading">
        <span className="detail-section__heading-num">02</span>
        Schedule
      </h2>
      <ol className="detail-schedule__list" aria-label="Event sessions">
        {event.schedules.map((session, i) => (
          <li key={i} className="detail-schedule__session">
            <div className="detail-schedule__time-col">
              <span className="detail-schedule__date">
                {formatDate(session.event_date, { day: 'numeric', month: 'short', weekday: 'short' })}
              </span>
              <span className="detail-schedule__time">
                {formatTime(session.start_time)}–{formatTime(session.end_time)}
              </span>
            </div>
            <div className="detail-schedule__venue">
              <svg
                className="detail-schedule__venue-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {session.venue}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
