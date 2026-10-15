import { memo, useEffect, useRef, useState } from 'react'
import './dock.css'

export interface OrbitalDockProps {
  isDocked: boolean
  /** Centre of the craft at the start of the track, in overlay coordinates. */
  x: number
  y: number
}

/**
 * The start of the mission: before the first scroll the craft floats inside a single holding ring
 * (centred on the craft, so nothing ever overlaps it) with a "Scroll to launch" hint. When the visitor
 * scrolls, the ring bursts outward as a launch ripple and the hint fades.
 */
function OrbitalDockComponent({ isDocked, x, y }: OrbitalDockProps) {
  const [launching, setLaunching] = useState(false)
  const wasDockedRef = useRef(isDocked)

  useEffect(() => {
    if (wasDockedRef.current && !isDocked) {
      setLaunching(true)
      const timer = setTimeout(() => setLaunching(false), 700)
      wasDockedRef.current = isDocked
      return () => clearTimeout(timer)
    }
    wasDockedRef.current = isDocked
    return undefined
  }, [isDocked])

  return (
    <div
      className={`orbital-dock${isDocked ? ' is-docked' : ''}${launching ? ' is-launching' : ''}`}
      style={{ transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)` }}
      aria-hidden="true"
    >
      <div className="orbital-dock__ring">
        <svg viewBox="0 0 64 64" className="orbital-dock__svg">
          <circle className="orbital-dock__track" cx="32" cy="32" r="30" />
          <g className="orbital-dock__sat">
            <circle cx="32" cy="2" r="2.2" />
          </g>
        </svg>
      </div>
      <span className="orbital-dock__hint mono">Scroll to launch</span>
    </div>
  )
}

export const OrbitalDock = memo(OrbitalDockComponent)
