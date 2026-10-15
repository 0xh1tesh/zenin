import { useState } from 'react'
import type { EventDetail, EventSummary } from '../../types'
import { formatDeadline, formatTeam } from '../../lib/format'
import { downloadIcs, eventToIcs } from '../../lib/ics'
import Countdown from '../ui/Countdown'
import PriceTag from '../ui/PriceTag'
import SeatsMeter from '../ui/SeatsMeter'
import { registrationState } from '../ui/StatusBadge'
import './detail-ticket.css'

interface TicketPanelProps {
  event: EventDetail | EventSummary
  onOpenRegister: () => void
}

export default function TicketPanel({ event, onOpenRegister }: TicketPanelProps) {
  const [copied, setCopied] = useState(false)
  const regState = registrationState(event)

  const handleCalendar = () => {
    const ics = eventToIcs(event, typeof window !== 'undefined' ? window.location.href : undefined)
    downloadIcs(`${event.name}-zenin26.ics`, ics)
  }

  const handleShare = async () => {
    if (typeof window === 'undefined') return
    const url = window.location.href

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `${event.name} · Zenin '26`,
          text: event.blurb,
          url,
        })
        return
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      /* clipboard write failed */
    }
  }

  const disabledLabel =
    event.event_status === 'COMPLETED'
      ? 'Event ended'
      : event.event_status === 'CLOSED'
        ? 'Event closed'
        : event.registration_status === 'SOLD_OUT'
          ? 'Sold out'
          : 'Registration closed'

  return (
    <aside className="detail-ticket" aria-label="Event ticket and registration">
      <div className="detail-ticket__stub-head">
        <span className="detail-ticket__stamp">// FESTIVAL PASS</span>
        <span className="detail-ticket__serial">{event.id.slice(0, 8).toUpperCase()}</span>
      </div>

      <div className="detail-ticket__price-block">
        <span className="detail-ticket__price-label">Admission</span>
        <PriceTag event={event} />
      </div>

      <div className="detail-ticket__perforation" aria-hidden="true" />

      <div className="detail-ticket__meta-list">
        <div className="detail-ticket__meta-row">
          <span className="detail-ticket__meta-label">Team Size</span>
          <span className="detail-ticket__meta-value">{formatTeam(event)}</span>
        </div>

        <div className="detail-ticket__meta-row">
          <span className="detail-ticket__meta-label">Capacity</span>
          <SeatsMeter event={event} showLabel={true} />
        </div>

        <div className="detail-ticket__meta-row">
          <span className="detail-ticket__meta-label">Deadline</span>
          <span className="detail-ticket__meta-value">
            {formatDeadline(event.registration_deadline)}
          </span>
        </div>
      </div>

      <div className="detail-ticket__countdown-box">
        <span className="detail-ticket__countdown-label">Closes In</span>
        <Countdown to={event.registration_deadline} />
      </div>

      {regState.registrable ? (
        <button
          type="button"
          className="btn btn--primary detail-ticket__cta"
          onClick={onOpenRegister}
        >
          Register for event
        </button>
      ) : (
        <button
          type="button"
          className="btn btn--ghost detail-ticket__cta"
          disabled
          aria-disabled="true"
        >
          {disabledLabel}
        </button>
      )}

      <div className="detail-ticket__btn-sub">
        <button
          type="button"
          className="detail-ticket__sec-btn"
          onClick={handleCalendar}
          aria-label="Add event to calendar"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Calendar
        </button>

        <button
          type="button"
          className="detail-ticket__sec-btn"
          onClick={handleShare}
          aria-label="Share this event"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share
        </button>
      </div>

      {copied && (
        <div className="detail-toast" role="status" aria-live="polite">
          Link copied to clipboard!
        </div>
      )}
    </aside>
  )
}
