import type { EventSummary } from '../../types'
import './ui.css'

export type RegistrationTone = 'open' | 'sold' | 'closed' | 'archive'

export interface RegistrationState {
  label: string
  tone: RegistrationTone
  registrable: boolean
}

type StatusFields = Pick<EventSummary, 'event_status' | 'registration_status'>

/** Single source of truth for "can I register, and what do we call this state". */
export function registrationState(e: StatusFields): RegistrationState {
  if (e.event_status === 'COMPLETED') return { label: 'Archive', tone: 'archive', registrable: false }
  if (e.event_status === 'CLOSED') return { label: 'Closed', tone: 'closed', registrable: false }
  if (e.registration_status === 'SOLD_OUT') return { label: 'Sold out', tone: 'sold', registrable: false }
  if (e.registration_status === 'CLOSED') return { label: 'Reg. closed', tone: 'closed', registrable: false }
  return { label: 'Open', tone: 'open', registrable: true }
}

export default function StatusBadge({ event }: { event: StatusFields }) {
  const { label, tone } = registrationState(event)
  return <span className={`ui-badge ui-badge--${tone}`}>{label}</span>
}
