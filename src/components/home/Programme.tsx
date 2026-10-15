import { useRef } from 'react'
import { Link } from 'react-router-dom'
import type { EventSummary } from '../../types'
import { formatDate, formatWeekday } from '../../lib/format'
import { registrationState } from '../ui/StatusBadge'
import { groupEventsByMonth } from './helpers'
import { Skeleton } from '../ui/Skeleton'
import Caret from '../ambient/Caret'
import { useInView } from '../ambient/useInView'
import './home.css'

export interface ProgrammeProps {
  events: EventSummary[] | null
}

const MONTH_SKELETONS = ['September 2026', 'October 2026', 'November 2026']

export default function Programme({ events }: ProgrammeProps) {
  const sectionRef = useRef<HTMLElement>(null)
  useInView(sectionRef)
  const monthGroups = groupEventsByMonth(events)

  return (
    <section
      ref={sectionRef}
      className="programme section"
      aria-label="Chronological programme schedule"
    >
      <div className="container">
        <div className="programme__header">
          <div>
            <p className="eyebrow programme__eyebrow">
              <span>05 · The programme</span>
              <Caret />
            </p>
            <h2 className="programme__heading">Timeline flight plan</h2>
          </div>
          <div className="programme__legend" aria-hidden="true">
            <span className="programme__legend-item">
              <span className="prog-dot prog-dot--open" /> Open
            </span>
            <span className="programme__legend-item">
              <span className="prog-dot prog-dot--sold" /> Sold out
            </span>
            <span className="programme__legend-item">
              <span className="prog-dot prog-dot--closed" /> Closed
            </span>
            <span className="programme__legend-item">
              <span className="prog-dot prog-dot--archive" /> Archived
            </span>
          </div>
        </div>

        {events === null ? (
          <div className="programme__groups" role="status" aria-label="Loading programme timeline">
            {MONTH_SKELETONS.map((month) => (
              <div key={month} className="programme__month">
                <div className="programme__month-head">
                  <div className="programme__month-title-wrap">
                    <span className="programme__month-title mono">{month}</span>
                  </div>
                </div>
                <div className="programme__month-list">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="programme-row programme-row--skel">
                      <Skeleton className="programme-row__date-skel" />
                      <Skeleton className="programme-row__title-skel" />
                      <Skeleton className="programme-row__meta-skel" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : monthGroups.length === 0 ? (
          <div className="programme__empty">
            <p className="programme__empty-text">No events currently scheduled in the flight plan.</p>
          </div>
        ) : (
          <div className="programme__groups">
            {monthGroups.map((group) => (
              <div key={group.key} className="programme__month">
                <div className="programme__month-head">
                  <div className="programme__month-title-wrap">
                    {/* Orbiting celestial dot */}
                    <div className="programme__orbit" aria-hidden="true">
                      <span className="programme__orbit-ring" />
                      <span className="programme__orbit-dot" />
                    </div>
                    <h3 className="programme__month-title mono">{group.label}</h3>
                  </div>
                  <span className="programme__month-count mono">
                    {group.events.length} {group.events.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                <div className="programme__month-list" role="list">
                  {/* Timeline spine with travelling light pulse */}
                  <div className="programme__month-spine" aria-hidden="true">
                    <div className="programme__spine-pulse" />
                  </div>

                  {group.events.map((event) => {
                    const state = registrationState(event)
                    const archived = event.event_status !== 'ACTIVE' || state.tone === 'archive'

                    return (
                      <div key={event.id} className="programme__item" role="listitem">
                        <Link
                          to={`/events/${event.id}`}
                          className={`programme-row${archived ? ' is-archived' : ''}`}
                          aria-label={`${event.name}, ${formatDate(event.schedule_summary.start_date)}, status: ${state.label}`}
                        >
                          <div className="programme-row__date mono">
                            <span className="programme-row__day">
                              {formatDate(event.schedule_summary.start_date)}
                            </span>
                            <span className="programme-row__weekday">
                              {formatWeekday(event.schedule_summary.start_date)}
                            </span>
                          </div>

                          <div className="programme-row__indicator">
                            <span
                              className={`prog-dot prog-dot--${state.tone}`}
                              title={state.label}
                              aria-hidden="true"
                            />
                          </div>

                          <div className="programme-row__content">
                            <h4 className="programme-row__name">{event.name}</h4>
                            <span className="programme-row__cat mono">{event.category}</span>
                          </div>

                          <div className="programme-row__meta">
                            <span className="programme-row__status mono">{state.label}</span>
                            <span className="programme-row__arrow" aria-hidden="true">
                              →
                            </span>
                          </div>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
