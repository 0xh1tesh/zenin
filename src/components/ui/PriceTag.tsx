import type { EventSummary } from '../../types'
import { formatPrice } from '../../lib/format'
import './ui.css'

interface PriceTagProps {
  event: Pick<EventSummary, 'price' | 'is_per_head'>
}

export default function PriceTag({ event }: PriceTagProps) {
  const label = formatPrice(event)
  const isFree = event.price === 0

  return (
    <span className={`ui-price${isFree ? ' ui-price--free' : ''}`} aria-label={`Price: ${label}`}>
      {isFree ? (
        <span className="ui-price__free">Free</span>
      ) : (
        <>
          <span className="ui-price__amount">{label}</span>
        </>
      )}
    </span>
  )
}
