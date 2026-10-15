import { memo } from 'react'

export interface RocketCraftProps {
  isLanded?: boolean
  isLaunching?: boolean
}

/**
 * Inline SVG rocket craft (~44px tall desktop, ~30px mobile).
 * Palette: bone/sand body with hairline outline, coral nose cone & fins,
 * porthole window with tiny glint, and 3-layered vermilion/coral/sand tail flame.
 */
function RocketCraftComponent({ isLanded = false, isLaunching = false }: RocketCraftProps) {
  return (
    <div
      className={`rocket-craft ${isLanded ? 'is-landed' : ''} ${isLaunching ? 'is-launching' : ''}`}
      aria-hidden="true"
    >
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
            {/* SVG glow filter using filterUnits="userSpaceOnUse" and explicit generous bounds */}
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
          </defs>

          {/* Engine Exhaust Flame (3 layered teardrops) */}
          <g
            className="rocket-flame-group"
            style={{ transformOrigin: '16px 39px' }}
            filter="url(#rocket-glow-filter)"
          >
            {/* Outer flame: vermilion */}
            <path
              d="M 13 39 C 12.5 45 16 55 16 55 C 16 55 19.5 45 19 39 Z"
              fill="var(--vermilion)"
              className="rocket-flame-outer"
            />
            {/* Mid flame: coral */}
            <path
              d="M 13.8 39 C 13.5 43.5 16 49.5 16 49.5 C 16 49.5 18.5 43.5 18.2 39 Z"
              fill="var(--coral)"
              className="rocket-flame-mid"
            />
            {/* Core flame: sand */}
            <path
              d="M 14.7 39 C 14.5 42 16 45 16 45 C 16 45 17.5 42 17.3 39 Z"
              fill="var(--sand)"
              className="rocket-flame-core"
            />
          </g>

          {/* Engine bell / nozzle */}
          <path
            d="M 13.5 37 L 18.5 37 L 19 39 L 13 39 Z"
            fill="var(--void-3)"
            stroke="var(--sand)"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />

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

          {/* Main fuselage body */}
          <path
            d="M 11 13.5 C 9.8 19.5 9.8 28.5 11 37 L 21 37 C 22.2 28.5 22.2 19.5 21 13.5 Z"
            fill="var(--bone)"
            stroke="var(--sand)"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Panel line details */}
          <line
            x1="11.5"
            y1="28"
            x2="20.5"
            y2="28"
            stroke="var(--line-strong)"
            strokeWidth="0.6"
            strokeDasharray="1.2 1.2"
          />

          {/* Central fuselage keel reflection */}
          <path
            d="M 16 14 L 16 36"
            stroke="var(--sand)"
            strokeWidth="0.5"
            strokeOpacity="0.4"
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
            {/* Glint reflection */}
            <path
              d="M 14.7 19.8 A 2.2 2.2 0 0 1 17.3 19.8"
              stroke="var(--bone)"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            <circle cx="15.1" cy="20.5" r="0.4" fill="var(--bone)" />
          </g>

          {/* Lower telemetry status dot */}
          <circle cx="16" cy="32.5" r="0.75" fill="var(--coral)" />
        </svg>
      </div>
    </div>
  )
}

export const RocketCraft = memo(RocketCraftComponent)
