import { useEffect, useRef } from 'react'
import type { EventDetail, EventSummary } from '../../types'
import { formatDeadline, formatTeam } from '../../lib/format'
import { deadlineToIcs, downloadIcs, eventToIcs } from '../../lib/ics'
import PriceTag from '../ui/PriceTag'
import './detail-ticket.css'

interface RegisterDialogProps {
  event: EventDetail | EventSummary
  isOpen: boolean
  onClose: () => void
}

export default function RegisterDialog({ event, isOpen, onClose }: RegisterDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  const handleReminder = () => {
    const ics = deadlineToIcs(event, typeof window !== 'undefined' ? window.location.href : undefined)
    downloadIcs(`${event.name}-registration-reminder.ics`, ics)
  }

  const handleCalendar = () => {
    const ics = eventToIcs(event, typeof window !== 'undefined' ? window.location.href : undefined)
    downloadIcs(`${event.name}-calendar.ics`, ics)
  }

  return (
    <dialog
      ref={dialogRef}
      className="detail-dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
      aria-labelledby="reg-dialog-title"
    >
      <div className="detail-dialog__inner">
        <div className="detail-dialog__header">
          <div>
            <span className="detail-dialog__eyebrow">// FESTIVAL PASS DISPATCH</span>
            <h2 id="reg-dialog-title" className="detail-dialog__title">
              Register for {event.name}
            </h2>
          </div>
          <button
            type="button"
            className="detail-dialog__close"
            onClick={onClose}
            aria-label="Close dialog"
            autoFocus
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="detail-dialog__desc">
          Registrations for Zenith &apos;26 events are processed directly by the organizing team and
          event heads. Spots are confirmed in order of form submission.
        </p>

        <div className="detail-dialog__meta-grid">
          <div className="detail-dialog__meta-item">
            <span className="detail-dialog__meta-label">Registration Fee</span>
            <span className="detail-dialog__meta-val">
              <PriceTag event={event} />
            </span>
          </div>
          <div className="detail-dialog__meta-item">
            <span className="detail-dialog__meta-label">Team Configuration</span>
            <span className="detail-dialog__meta-val">{formatTeam(event)}</span>
          </div>
          <div className="detail-dialog__meta-item">
            <span className="detail-dialog__meta-label">Registration Deadline</span>
            <span className="detail-dialog__meta-val">
              {formatDeadline(event.registration_deadline)}
            </span>
          </div>
          <div className="detail-dialog__meta-item">
            <span className="detail-dialog__meta-label">Event Mode</span>
            <span className="detail-dialog__meta-val">
              {event.event_mode === 'ONLINE' ? 'Online' : 'Campus (Pune)'}
            </span>
          </div>
        </div>

        <div className="detail-dialog__actions">
          <button type="button" className="btn btn--primary" onClick={handleReminder}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            Add reminder
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleCalendar}>
            <svg
              width="16"
              height="16"
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
            Add to calendar
          </button>
        </div>
      </div>
    </dialog>
  )
}
