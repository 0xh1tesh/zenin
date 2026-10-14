import { useEffect, useRef } from 'react'
import type { EventSummary } from '../../types'
import { fillRatio, seatsLeft } from '../../lib/format'
import './ui.css'

interface SeatsMeterProps {
  event: Pick<EventSummary, 'total_seats' | 'seats_filled'>
  showLabel?: boolean
}

export default function SeatsMeter({ event, showLabel = false }: SeatsMeterProps) {
  const ratio = fillRatio(event)
  const left = seatsLeft(event)
  const barRef = useRef<HTMLDivElement>(null)

  // Animate fill on mount — only transform/opacity
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    bar.style.transform = 'scaleX(0)'
    bar.style.transformOrigin = 'left'
    const id = requestAnimationFrame(() => {
      bar.style.transition = `transform 600ms var(--ease, cubic-bezier(0.2,0.7,0.1,1))`
      bar.style.transform = `scaleX(${ratio})`
    })
    return () => cancelAnimationFrame(id)
  }, [ratio])

  const pct = Math.round(ratio * 100)
  const urgency = ratio >= 0.9 ? 'ui-seats--urgent' : ratio >= 0.7 ? 'ui-seats--warn' : ''

  return (
    <div className={`ui-seats ${urgency}`}>
      <div
        className="ui-seats__track"
        role="meter"
        aria-label={`${pct}% seats filled`}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div ref={barRef} className="ui-seats__fill" />
      </div>
      {showLabel && (
        <span className="ui-seats__label mono">
          {left === 0 ? 'No seats left' : `${left} left`}
        </span>
      )}
    </div>
  )
}
