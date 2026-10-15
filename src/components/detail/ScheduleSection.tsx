import type { Session } from '../../types'
import { formatDate, formatTime } from '../../lib/format'
import './detail-sections.css'
import './detail-schedule.css'

interface ScheduleSectionProps {
  schedules: Session[]
  num?: string
}

export default function ScheduleSection({ schedules, num = '03' }: ScheduleSectionProps) {
  if (!schedules || schedules.length === 0) return null

  return (
    <section id="schedule" className="detail-section" aria-labelledby="schedule-heading">
      <div className="detail-section__header">
        <span className="detail-section__num">{num} //</span>
        <h2 id="schedule-heading" className="detail-section__title">
          Schedule
        </h2>
      </div>
      <div className="detail-section__rule" aria-hidden="true" />

      <ol className="detail-schedule__list" aria-label="Event sessions">
        {schedules.map((session, i) => (
          <li key={i} className="detail-schedule__card">
            <div className="detail-schedule__time-col">
              <span className="detail-schedule__date">
                {formatDate(session.event_date, {
                  day: 'numeric',
                  month: 'short',
                  weekday: 'short',
                })}
              </span>
              <span className="detail-schedule__time">
                {formatTime(session.start_time)} to {formatTime(session.end_time)} IST
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
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{session.venue}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
