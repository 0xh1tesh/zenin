import type { EventSummary } from '../../types'
import { formatInr } from '../../lib/format'
import './ui.css'

export default function PriceTag({ event }: { event: Pick<EventSummary, 'price' | 'is_per_head'> }) {
  if (event.price === 0) return <span className="ui-price ui-price--free">Free</span>
  return (
    <span className="ui-price">
      <span>{formatInr(event.price)}</span>
      <span className="ui-price__unit">/{event.is_per_head ? 'person' : 'team'}</span>
    </span>
  )
}
