import { memo } from 'react'

export interface RocketCraftProps {
  isLanded?: boolean
  isLaunching?: boolean
  isSeparated?: boolean
  justSeparated?: boolean
}

/**
 * Detailed inline SVG rocket craft.
 * Features:
 * - Aerodynamic fuselage with panel lines & keel reflection
 * - Two wing fins plus center ventral stabilizer fin
 * - Porthole window with glass rim, void interior, blue rim & glint
 * - Detailed nozzle bell
 * - Detachable booster stage ring (collapses craft length on stage separation)
 * - Detached tumbling booster on one-shot separation crossing
 * - Re-entry plasma sheath on nose cone
 * - 4 streaming speed lines during high scroll velocity
 * - Palette: bone, sand, coral, vermilion, blue, void-3
 */
function RocketCraftComponent({
  isLanded = false,
  isLaunching = false,
  isSeparated = false,
  justSeparated = false,
}: RocketCraftProps) {
  return (
    <div
      className={`rocket-craft ${isLanded ? 'is-landed' : ''} ${isLaunching ? 'is-launching' : ''} ${isSeparated ? 'is-separated' : ''}`}
      aria-hidden="true"
    >
      {/* High-velocity warp speed lines (opacity controlled via ref during scroll ticks) */}
      <div className="rocket-speed-lines" aria-hidden="true">
        <span className="rocket-speed-line rocket-speed-line--1" />
        <span className="rocket-speed-line rocket-speed-line--2" />
        <span className="rocket-speed-line rocket-speed-line--3" />
        <span className="rocket-speed-line rocket-speed-line--4" />
      </div>

      {/* Detached booster ring tumbling away on one-shot stage separation crossing */}
      {justSeparated && (
        <div className="rocket-booster-tumble" aria-hidden="true">
          <svg viewBox="0 0 20 12" width="20" height="12" fill="none">
            <rect
              x="2"
              y="2"
              width="16"
              height="6"
              rx="1"
              fill="var(--void-3)"
              stroke="var(--sand)"
              strokeWidth="0.8"
            />
            <line x1="2" y1="5" x2="18" y2="5" stroke="var(--coral)" strokeWidth="0.9" />
            <path d="M 6 8 L 14 8 L 12 11 L 8 11 Z" fill="var(--sand)" />
          </svg>
        </div>
      )}

      {/* Craft body with idle bobbing */}
      <div className="rocket-bobber">
        <svg
          viewBox="0 0 32 56"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="rocket-svg"
        >
          <defs>
            {/* SVG glow filter: filterUnits="userSpaceOnUse" with explicit generous bounds (Hard rule 9) */}
            <filter
              id="rocket-glow-filter"
              filterUnits="userSpaceOnUse"
              x="-40"
              y="-40"
              width="120"
              height="140"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Re-entry heat glow filter */}
            <filter
              id="rocket-reentry-filter"
              filterUnits="userSpaceOnUse"
              x="-30"
              y="-30"
              width="92"
              height="92"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="rocket-reentry-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--vermilion)" />
              <stop offset="100%" stopColor="var(--coral)" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Engine Exhaust Flame (3 layered teardrops) */}
          <g
            className="rocket-flame-group"
            style={{ transformOrigin: isSeparated ? '16px 35px' : '16px 39px' }}
            filter="url(#rocket-glow-filter)"
          >
            {/* Outer flame: vermilion */}
            <path
              d={
                isSeparated
                  ? 'M 13 35 C 12.5 41 16 50 16 50 C 16 50 19.5 41 19 35 Z'
                  : 'M 13 39 C 12.5 45 16 55 16 55 C 16 55 19.5 45 19 39 Z'
              }
              fill="var(--vermilion)"
              className="rocket-flame-outer"
            />
            {/* Mid flame: coral */}
            <path
              d={
                isSeparated
                  ? 'M 13.8 35 C 13.5 39.5 16 45.5 16 45.5 C 16 45.5 18.5 39.5 18.2 35 Z'
                  : 'M 13.8 39 C 13.5 43.5 16 49.5 16 49.5 C 16 49.5 18.5 43.5 18.2 39 Z'
              }
              fill="var(--coral)"
              className="rocket-flame-mid"
            />
            {/* Core flame: sand */}
            <path
              d={
                isSeparated
                  ? 'M 14.7 35 C 14.5 38 16 41 16 41 C 16 41 17.5 38 17.3 35 Z'
                  : 'M 14.7 39 C 14.5 42 16 45 16 45 C 16 45 17.5 42 17.3 39 Z'
              }
              fill="var(--sand)"
              className="rocket-flame-core"
            />
          </g>

          {/* Engine bell / nozzle */}
          <path
            d={
              isSeparated
                ? 'M 13.5 33 L 18.5 33 L 19 35 L 13 35 Z'
                : 'M 13.5 37 L 18.5 37 L 19 39 L 13 39 Z'
            }
            fill="var(--void-3)"
            stroke="var(--sand)"
            strokeWidth="0.65"
            strokeLinejoin="round"
          />

          {/* Booster stage ring (detaches at p >= 0.5; hidden when separated) */}
          <g className="rocket-booster-stage">
            <rect
              x="11"
              y="32"
              width="10"
              height="5"
              fill="var(--void-2)"
              stroke="var(--sand)"
              strokeWidth="0.75"
            />
            <line
              x1="11.5"
              y1="34.5"
              x2="20.5"
              y2="34.5"
              stroke="var(--coral)"
              strokeWidth="0.8"
            />
          </g>

          {/* Left curved fin */}
          <path
            d="M 11 26 C 8.5 28.5 5 34.5 5 39 C 8 38 10 37.2 11 36.5 Z"
            fill="var(--coral)"
            stroke="var(--sand)"
            strokeWidth="0.75"
            strokeLinejoin="round"
          />

          {/* Right curved fin */}
          <path
            d="M 21 26 C 23.5 28.5 27 34.5 27 39 C 24 38 22 37.2 21 36.5 Z"
            fill="var(--coral)"
            stroke="var(--sand)"
            strokeWidth="0.75"
            strokeLinejoin="round"
          />

          {/* Ventral stabilizer fin along fuselage centerline */}
          <path
            d="M 15.3 27 L 16 34 L 16.7 27 Z"
            fill="var(--coral)"
            stroke="var(--sand)"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />

          {/* Main fuselage body */}
          <path
            d="M 11 13.5 C 9.8 19.5 9.8 28 11 32 L 21 32 C 22.2 28 22.2 19.5 21 13.5 Z"
            fill="var(--bone)"
            stroke="var(--sand)"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Panel seam details */}
          <line
            x1="11.2"
            y1="18.5"
            x2="20.8"
            y2="18.5"
            stroke="var(--line-strong)"
            strokeWidth="0.6"
            strokeDasharray="1.2 1.2"
          />
          <line
            x1="10.8"
            y1="25.5"
            x2="21.2"
            y2="25.5"
            stroke="var(--line-strong)"
            strokeWidth="0.6"
            strokeDasharray="1.2 1.2"
          />

          {/* Central fuselage keel reflection */}
          <path
            d="M 16 14 L 16 30"
            stroke="var(--sand)"
            strokeWidth="0.5"
            strokeOpacity="0.4"
          />

          {/* Re-entry heat plasma glow sheath over nose (opacity controlled via ref) */}
          <path
            d="M 16 1 C 13.5 4.5 9.5 9.5 9.5 14.5 L 22.5 14.5 C 22.5 9.5 18.5 4.5 16 1 Z"
            fill="url(#rocket-reentry-grad)"
            filter="url(#rocket-reentry-filter)"
            className="rocket-reentry-glow"
          />

          {/* Nose cone */}
          <path
            d="M 16 3 C 14.5 6 11 10.5 11 13.5 L 21 13.5 C 21 10.5 17.5 6 16 3 Z"
            fill="var(--coral)"
            stroke="var(--sand)"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Nose tip beacon */}
          <circle cx="16" cy="3.5" r="0.8" fill="var(--sand)" />

          {/* Porthole window */}
          <g className="rocket-porthole">
            {/* Metallic rim */}
            <circle cx="16" cy="21.5" r="4.2" fill="var(--sand)" />
            {/* Deep dark void / blue glass */}
            <circle cx="16" cy="21.5" r="3.2" fill="var(--void)" stroke="var(--blue)" strokeWidth="0.6" />
            {/* Glint reflection arc */}
            <path
              d="M 14.7 19.8 A 2.2 2.2 0 0 1 17.3 19.8"
              stroke="var(--bone)"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            {/* Specular dot */}
            <circle cx="15.1" cy="20.5" r="0.4" fill="var(--bone)" />
          </g>

          {/* Telemetry status LED */}
          <circle cx="16" cy="28.5" r="0.7" fill="var(--coral)" />
        </svg>
      </div>
    </div>
  )
}

export const RocketCraft = memo(RocketCraftComponent)
