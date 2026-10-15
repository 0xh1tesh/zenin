import { memo, useEffect, useState } from 'react'

export interface LandingPadProps {
  isLanded: boolean
  isVisible: boolean
  onLaunchAgain: () => void
}

/**
 * Landing pad and docking station rendered at the end of the rocket's flight path.
 * Features:
 * - Geometric landing pad with pulse beacon LEDs
 * - Dust puff burst on touchdown
 * - 'Touchdown' mono telemetry badge
 * - Accessible 'Launch again' button (aria-label="Back to top", pointer-events: auto)
 */
function LandingPadComponent({ isLanded, isVisible, onLaunchAgain }: LandingPadProps) {
  const [showDust, setShowDust] = useState(false)

  // Trigger dust-puff burst when touching down
  useEffect(() => {
    if (isLanded) {
      setShowDust(true)
      const timer = setTimeout(() => setShowDust(false), 800)
      return () => clearTimeout(timer)
    } else {
      setShowDust(false)
    }
  }, [isLanded])

  if (!isVisible) return null

  return (
    <div
      className={`rocket-dock ${isLanded ? 'is-landed' : ''}`}
      aria-hidden={!isLanded ? 'true' : undefined}
    >
      {/* Visual docking pad line & crater cradle */}
      <div className="rocket-dock__cradle" aria-hidden="true">
        <svg
          viewBox="0 0 54 18"
          width="54"
          height="18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="rocket-dock__svg"
        >
          {/* Landing base line */}
          <line
            x1="4"
            y1="14"
            x2="50"
            y2="14"
            stroke="var(--sand)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Left bracket */}
          <path
            d="M 6 8 L 12 14"
            stroke="var(--coral)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Right bracket */}
          <path
            d="M 48 8 L 42 14"
            stroke="var(--coral)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Hatch grid marks under pad */}
          <line x1="18" y1="14" x2="16" y2="17" stroke="var(--line-strong)" strokeWidth="0.8" />
          <line x1="24" y1="14" x2="22" y2="17" stroke="var(--line-strong)" strokeWidth="0.8" />
          <line x1="30" y1="14" x2="28" y2="17" stroke="var(--line-strong)" strokeWidth="0.8" />
          <line x1="36" y1="14" x2="34" y2="17" stroke="var(--line-strong)" strokeWidth="0.8" />

          {/* Left and right guide beacon dots */}
          <circle cx="6" cy="7" r="1.5" fill="var(--coral)" className="rocket-beacon" />
          <circle cx="48" cy="7" r="1.5" fill="var(--coral)" className="rocket-beacon" />
        </svg>

        {/* Dust puff burst elements */}
        {showDust && (
          <div className="rocket-dust-burst" aria-hidden="true">
            <span className="rocket-dust-puff rocket-dust-puff--1" />
            <span className="rocket-dust-puff rocket-dust-puff--2" />
            <span className="rocket-dust-puff rocket-dust-puff--3" />
            <span className="rocket-dust-puff rocket-dust-puff--4" />
          </div>
        )}
      </div>

      {/* Touchdown indicator & Launch again button */}
      <div className="rocket-dock__actions">
        <span className="rocket-dock__status mono" aria-hidden="true">
          Touchdown
        </span>
        <button
          type="button"
          className="rocket-dock__btn mono"
          aria-label="Back to top"
          onClick={onLaunchAgain}
        >
          <span className="rocket-dock__btn-icon" aria-hidden="true">
            ▲
          </span>
          Launch again
        </button>
      </div>
    </div>
  )
}

export const LandingPad = memo(LandingPadComponent)
