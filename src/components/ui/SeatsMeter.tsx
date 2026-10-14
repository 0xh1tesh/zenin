import type { CSSProperties } from 'react'
import type { EventSummary } from '../../types'
import { fillRatio, seatsLeft } from '../../lib/format'
import { cx } from '../../lib/cx'
import './ui.css'

interface SeatsMeterProps {
  event: Pick<EventSummary, 'total_seats' | 'seats_filled'>
  showLabel?: boolean
}

export default function SeatsMeter({ event, showLabel = true }: SeatsMeterProps) {
  const ratio = fillRatio(event)
  const left = seatsLeft(event)
  const tone = ratio >= 0.9 ? 'urgent' : ratio >= 0.7 ? 'warn' : null

  return (
    <div className={cx('ui-seats', tone && `ui-seats--${tone}`)}>
      <div
        className="ui-seats__track"
        role="meter"
        aria-label="Seats taken"
        aria-valuemin={0}
        aria-valuemax={event.total_seats}
        aria-valuenow={event.seats_filled}
        aria-valuetext={`${event.seats_filled} of ${event.total_seats} seats taken`}
      >
        <div className="ui-seats__fill" style={{ '--fill': ratio } as CSSProperties} />
      </div>
      {showLabel && (
        <span className="ui-seats__label">
          {left === 0 ? 'Full' : ratio >= 0.9 ? `Only ${left} left` : `${left} left`}
        </span>
      )}
    </div>
  )
}
