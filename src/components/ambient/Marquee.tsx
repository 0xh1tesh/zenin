import { useRef } from 'react'
import { useInView } from './useInView'
import './marquee.css'

export interface MarqueeProps {
  items: readonly string[] | string[]
  reverse?: boolean
  tilt?: boolean
  speedSec?: number
  ariaLabel?: string
  className?: string
}

export default function Marquee({
  items,
  reverse = false,
  tilt = false,
  speedSec = 32,
  ariaLabel = 'Live mission announcements ticker',
  className = '',
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  useInView(containerRef)

  const classes = [
    'marquee-wrap',
    tilt ? 'marquee-wrap--tilted' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const trackContainerClasses = [
    'marquee-track-container',
    reverse ? 'marquee--reverse' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={containerRef}
      className={classes}
      role="region"
      aria-label={ariaLabel}
    >
      <div
        className={trackContainerClasses}
        style={{ '--marquee-duration': `${speedSec}s` } as React.CSSProperties}
      >
        <div className="marquee-track">
          {items.map((item, idx) => (
            <span key={idx} className="marquee-item mono">
              <span>{item}</span>
              <span className="marquee-star" aria-hidden="true">
                ✦
              </span>
            </span>
          ))}
        </div>
        {/* Duplicate track for seamless infinite loop (hidden from assistive tech) */}
        <div className="marquee-track" aria-hidden="true">
          {items.map((item, idx) => (
            <span key={`dup-${idx}`} className="marquee-item mono">
              <span>{item}</span>
              <span className="marquee-star" aria-hidden="true">
                ✦
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
