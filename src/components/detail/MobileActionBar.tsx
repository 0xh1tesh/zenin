import type { EventDetail, EventSummary } from '../../types'
import PriceTag from '../ui/PriceTag'
import { registrationState } from '../ui/StatusBadge'
import './detail-ticket.css'

interface MobileActionBarProps {
  event: EventDetail | EventSummary
  onOpenRegister: () => void
}

export default function MobileActionBar({ event, onOpenRegister }: MobileActionBarProps) {
  const regState = registrationState(event)

  const disabledLabel =
    event.event_status === 'COMPLETED'
      ? 'Event ended'
      : event.event_status === 'CLOSED'
        ? 'Closed'
        : event.registration_status === 'SOLD_OUT'
          ? 'Sold out'
          : 'Reg. closed'

  return (
    <div className="detail-mobile-bar" aria-label="Mobile ticket actions">
      <div className="detail-mobile-bar__info">
        <span className="detail-mobile-bar__label">Admission</span>
        <PriceTag event={event} />
      </div>

      {regState.registrable ? (
        <button
          type="button"
          className="btn btn--primary detail-mobile-bar__btn"
          onClick={onOpenRegister}
        >
          Register
        </button>
      ) : (
        <button
          type="button"
          className="btn btn--ghost detail-mobile-bar__btn"
          disabled
          aria-disabled="true"
        >
          {disabledLabel}
        </button>
      )}
    </div>
  )
}
