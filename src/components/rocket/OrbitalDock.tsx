import { memo, useEffect, useRef, useState } from 'react'
import './dock.css'

export interface OrbitalDockProps {
  isDocked: boolean
  x: number
  y: number
}

/**
 * Orbital Docking Station at the start of the rocket's flight path (p ~ 0).
 * Features:
 * - Code-drawn space station gantry with docking ring & truss wings
 * - Blinking marker LEDs
 * - Mechanical docking clamps that open on undock
 * - Cold-gas thruster puff burst when detaching
 */
function OrbitalDockComponent({ isDocked, x, y }: OrbitalDockProps) {
  const [showPuff, setShowPuff] = useState(false)
  const prevDockedRef = useRef(isDocked)

  // Trigger cold-gas puff when transitioning from docked to undocked
  useEffect(() => {
    if (prevDockedRef.current && !isDocked) {
      setShowPuff(true)
      const timer = setTimeout(() => setShowPuff(false), 650)
      return () => clearTimeout(timer)
    }
    prevDockedRef.current = isDocked
  }, [isDocked])

  return (
    <div
      className={`orbital-dock ${isDocked ? 'is-docked' : 'is-undocked'}`}
      style={{ transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)` }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 60 40"
        width="60"
        height="40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="orbital-dock__svg"
      >
        {/* Overhead orbital station gantry bar */}
        <line
          x1="6"
          y1="8"
          x2="54"
          y2="8"
          stroke="var(--sand)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Diagonal truss braces */}
        <line x1="12" y1="8" x2="16" y2="2" stroke="var(--line-strong)" strokeWidth="0.8" />
        <line x1="20" y1="8" x2="16" y2="2" stroke="var(--line-strong)" strokeWidth="0.8" />
        <line x1="40" y1="8" x2="44" y2="2" stroke="var(--line-strong)" strokeWidth="0.8" />
        <line x1="48" y1="8" x2="44" y2="2" stroke="var(--line-strong)" strokeWidth="0.8" />

        {/* Central docking collar ring */}
        <path
          d="M 22 8 C 22 17 38 17 38 8"
          stroke="var(--sand)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Docking clamp left (rotates outward when undocked) */}
        <g className="dock-clamp dock-clamp--left" style={{ transformOrigin: '21px 8px' }}>
          <path
            d="M 21 8 L 19 18 L 24 19"
            stroke="var(--coral)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="19" r="1" fill="var(--sand)" />
        </g>

        {/* Docking clamp right (rotates outward when undocked) */}
        <g className="dock-clamp dock-clamp--right" style={{ transformOrigin: '39px 8px' }}>
          <path
            d="M 39 8 L 41 18 L 36 19"
            stroke="var(--coral)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="36" cy="19" r="1" fill="var(--sand)" />
        </g>

        {/* Blinking marker navigation lights */}
        <circle cx="8" cy="8" r="1.5" fill="var(--coral)" className="dock-marker dock-marker--left" />
        <circle cx="52" cy="8" r="1.5" fill="var(--coral)" className="dock-marker dock-marker--right" />
      </svg>

      {/* Cold-gas lateral puff fanning out on undock */}
      {showPuff && (
        <div className="dock-gas-burst" aria-hidden="true">
          <span className="dock-gas-dot dock-gas-dot--1" />
          <span className="dock-gas-dot dock-gas-dot--2" />
          <span className="dock-gas-dot dock-gas-dot--3" />
          <span className="dock-gas-dot dock-gas-dot--4" />
        </div>
      )}
    </div>
  )
}

export const OrbitalDock = memo(OrbitalDockComponent)
