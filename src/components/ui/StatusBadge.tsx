import type { EventSummary } from '../../types'
import './ui.css'

interface StatusBadgeProps {
  event: Pick<EventSummary, 'event_status' | 'registration_status'>
}

const STATUS_MAP: Record<string, { label: string; mod: string }> = {
  OPEN: { label: 'Open', mod: 'ui-badge--open' },
  CLOSED: { label: 'Closed', mod: 'ui-badge--closed' },
  SOLD_OUT: { label: 'Sold Out', mod: 'ui-badge--sold-out' },
}

export default function StatusBadge({ event }: StatusBadgeProps) {
  const { event_status, registration_status } = event

  if (event_status === 'COMPLETED') {
    return (
      <span className="ui-badge ui-badge--completed" aria-label="Event completed">
        Completed
      </span>
    )
  }

  const s = STATUS_MAP[registration_status] ?? { label: registration_status, mod: '' }

  return (
    <span className={`ui-badge ${s.mod}`} aria-label={`Registration ${s.label}`}>
      {s.label}
    </span>
  )
}
