import { memo } from 'react'
import { CELESTIAL_BODIES, type CelestialBodyData } from './deepSky'

/**
 * Renders the ringed planet with a 3D layered front/back ring system.
 */
function RingedPlanet() {
  return (
    <svg viewBox="0 0 100 80" width="100%" height="100%" aria-hidden="true">
      <defs>
        <radialGradient id="deepsky-ringed-grad" cx="35%" cy="32%" r="68%">
          <stop offset="0%" stopColor="var(--sand)" />
          <stop offset="45%" stopColor="var(--void-3)" />
          <stop offset="100%" stopColor="var(--void)" />
        </radialGradient>
        <clipPath id="deepsky-ring-front-clip">
          <rect x="0" y="40" width="100" height="40" />
        </clipPath>
      </defs>

      <g transform="rotate(-18 50 40)">
        {/* Back Ring: rendered behind the planet body */}
        <ellipse
          cx="50"
          cy="40"
          rx="44"
          ry="11"
          fill="none"
          stroke="var(--sand)"
          strokeWidth="2.2"
          opacity="0.35"
        />
        <ellipse
          cx="50"
          cy="40"
          rx="38"
          ry="8.5"
          fill="none"
          stroke="var(--coral)"
          strokeWidth="1.2"
          opacity="0.3"
        />

        {/* Planet Sphere */}
        <circle cx="50" cy="40" r="21" fill="url(#deepsky-ringed-grad)" />
        {/* Subtle cloud band across planet */}
        <path
          d="M 30 38 Q 50 42 70 38"
          stroke="var(--sand)"
          strokeWidth="1.2"
          opacity="0.25"
          fill="none"
        />

        {/* Front Ring: clipped to front hemisphere */}
        <g clipPath="url(#deepsky-ring-front-clip)">
          <ellipse
            cx="50"
            cy="40"
            rx="44"
            ry="11"
            fill="none"
            stroke="var(--sand)"
            strokeWidth="2.2"
            opacity="0.8"
          />
          <ellipse
            cx="50"
            cy="40"
            rx="38"
            ry="8.5"
            fill="none"
            stroke="var(--coral)"
            strokeWidth="1.2"
            opacity="0.6"
          />
        </g>
      </g>
    </svg>
  )
}

/**
 * Cratered Moon with a true spherical terminator shadow arc.
 */
function CrateredMoon() {
  return (
    <svg viewBox="0 0 70 70" width="100%" height="100%" aria-hidden="true">
      <defs>
        <radialGradient id="deepsky-moon-grad" cx="32%" cy="30%" r="70%">
          <stop offset="0%" stopColor="var(--bone)" />
          <stop offset="65%" stopColor="var(--muted)" />
          <stop offset="100%" stopColor="var(--void-3)" />
        </radialGradient>
      </defs>

      {/* Moon Base Sphere */}
      <circle cx="35" cy="35" r="26" fill="url(#deepsky-moon-grad)" />

      {/* Craters */}
      <g opacity="0.35">
        <ellipse cx="26" cy="24" rx="4.5" ry="3.5" fill="var(--void-3)" stroke="var(--bone)" strokeWidth="0.6" />
        <ellipse cx="20" cy="38" rx="6" ry="4.5" fill="var(--void-3)" stroke="var(--bone)" strokeWidth="0.6" />
        <ellipse cx="33" cy="44" rx="5" ry="3.5" fill="var(--void-3)" stroke="var(--bone)" strokeWidth="0.6" />
        <ellipse cx="38" cy="22" rx="3" ry="2.2" fill="var(--void-3)" stroke="var(--bone)" strokeWidth="0.5" />
      </g>

      {/* Terminator Shadow: elliptical arc covering the unlit hemisphere */}
      <path
        d="M 35 9 A 26 26 0 0 1 35 61 A 14 26 0 0 0 35 9 Z"
        fill="var(--void)"
        opacity="0.68"
      />
    </svg>
  )
}

/**
 * Distant Blue Ice Planet with limb-brightening atmosphere rim.
 */
function IcePlanet() {
  return (
    <svg viewBox="0 0 60 60" width="100%" height="100%" aria-hidden="true">
      <defs>
        <radialGradient id="deepsky-ice-grad" cx="28%" cy="26%" r="74%">
          <stop offset="0%" stopColor="var(--blue)" />
          <stop offset="45%" stopColor="#173f60" />
          <stop offset="85%" stopColor="var(--void-3)" />
          <stop offset="100%" stopColor="var(--void)" />
        </radialGradient>
        <filter id="deepsky-ice-rim-glow" filterUnits="userSpaceOnUse" x="-10" y="-10" width="80" height="80">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
      </defs>

      {/* Ice Planet Core */}
      <circle cx="30" cy="30" r="20" fill="url(#deepsky-ice-grad)" />

      {/* Thin Atmosphere Rim */}
      <path
        d="M 13 22 A 20 20 0 0 1 34 10"
        fill="none"
        stroke="var(--bone)"
        strokeWidth="1.2"
        opacity="0.85"
        filter="url(#deepsky-ice-rim-glow)"
      />
    </svg>
  )
}

/**
 * Spiral Galaxy with rotating nucleus and logarithmic arms.
 */
function SpiralGalaxy() {
  return (
    <div className="deepsky-galaxy-container">
      <svg viewBox="0 0 120 120" width="100%" height="100%" className="deepsky-galaxy-svg" aria-hidden="true">
        <defs>
          <filter id="deepsky-galaxy-glow" filterUnits="userSpaceOnUse" x="10" y="10" width="100" height="100">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* Nucleus Glow */}
        <circle cx="60" cy="60" r="10" fill="var(--sand)" opacity="0.6" filter="url(#deepsky-galaxy-glow)" />
        <circle cx="60" cy="60" r="4" fill="var(--bone)" opacity="0.95" />

        {/* Spiral Arm 1 */}
        <path
          d="M 60 60 C 66 50, 82 46, 94 56 C 104 64, 108 78, 102 92"
          fill="none"
          stroke="var(--sand)"
          strokeWidth="1.2"
          strokeDasharray="2 3"
          opacity="0.45"
        />
        {/* Spiral Arm 2 */}
        <path
          d="M 60 60 C 54 70, 38 74, 26 64 C 16 56, 12 42, 18 28"
          fill="none"
          stroke="var(--bone)"
          strokeWidth="1.2"
          strokeDasharray="2 3"
          opacity="0.45"
        />

        {/* Star clusters along arms */}
        <circle cx="82" cy="50" r="1.5" fill="var(--coral)" opacity="0.7" />
        <circle cx="98" cy="68" r="1.3" fill="var(--bone)" opacity="0.6" />
        <circle cx="38" cy="70" r="1.5" fill="var(--sand)" opacity="0.7" />
        <circle cx="22" cy="52" r="1.3" fill="var(--coral)" opacity="0.6" />
      </svg>
    </div>
  )
}

/**
 * Pulsar emitting concentric expanding rings.
 */
function Pulsar({ tone = 'coral' }: { tone?: 'coral' | 'sand' }) {
  const color = tone === 'coral' ? 'var(--coral)' : 'var(--sand)'
  return (
    <svg viewBox="0 0 60 60" width="100%" height="100%" aria-hidden="true">
      {/* Concentric expanding wave rings */}
      <circle cx="30" cy="30" r="6" className="deepsky-pulsar-ring deepsky-pulsar-ring--1" stroke={color} />
      <circle cx="30" cy="30" r="6" className="deepsky-pulsar-ring deepsky-pulsar-ring--2" stroke={color} />
      <circle cx="30" cy="30" r="6" className="deepsky-pulsar-ring deepsky-pulsar-ring--3" stroke={color} />

      {/* High-energy central point */}
      <circle cx="30" cy="30" r="2.5" fill={color} opacity="0.95" />
      <path d="M 30 25 L 30 35 M 25 30 L 35 30" stroke={color} strokeWidth="0.8" opacity="0.8" />
    </svg>
  )
}

/**
 * Binary Star Pair revolving around their barycentre.
 */
function BinaryStar() {
  return (
    <div className="deepsky-binary-system">
      <svg viewBox="0 0 50 50" width="100%" height="100%" aria-hidden="true">
        {/* Star Alpha (Sand primary) */}
        <circle cx="16" cy="25" r="3.4" fill="var(--sand)" opacity="0.9" />
        {/* Star Beta (Coral companion) */}
        <circle cx="34" cy="25" r="2.4" fill="var(--coral)" opacity="0.85" />
        {/* Faint gravitational bridge */}
        <line x1="16" y1="25" x2="34" y2="25" stroke="var(--bone)" strokeWidth="0.5" strokeDasharray="1 2" opacity="0.3" />
      </svg>
    </div>
  )
}

/**
 * Faceted tumbling asteroid silhouette.
 */
function Asteroid({ variant = 'a' }: { variant?: 'a' | 'b' }) {
  const points =
    variant === 'a'
      ? '16,3 25,8 29,19 22,28 11,27 4,18 7,7'
      : '13,2 21,6 23,15 17,22 8,21 3,14 6,5'
  return (
    <div className={`deepsky-asteroid deepsky-asteroid--${variant}`}>
      <svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">
        <polygon points={points} fill="var(--void-3)" stroke="var(--muted)" strokeWidth="0.8" opacity="0.8" />
        <path d="M 11 12 L 19 16 L 15 23" fill="none" stroke="var(--bone)" strokeWidth="0.5" opacity="0.4" />
      </svg>
    </div>
  )
}

/**
 * DeepSkyBodies: Renders the 9 celestial bodies spaced across the sky flanks.
 */
function DeepSkyBodiesComponent() {
  return (
    <div className="deepsky-bodies-layer" aria-hidden="true">
      {CELESTIAL_BODIES.map((body: CelestialBodyData) => {
        const style: React.CSSProperties = {
          top: body.position.top,
          ...(body.position.left ? { left: body.position.left } : {}),
          ...(body.position.right ? { right: body.position.right } : {}),
          width: `${body.size}px`,
          height: `${body.size}px`,
          opacity: body.opacity,
        }

        return (
          <div
            key={body.id}
            className={`deepsky-body deepsky-body--${body.type} ${
              body.isMobile ? '' : 'deepsky-body--desktop-only'
            }`}
            style={style}
          >
            {body.type === 'ringed-planet' && <RingedPlanet />}
            {body.type === 'cratered-moon' && <CrateredMoon />}
            {body.type === 'ice-planet' && <IcePlanet />}
            {body.type === 'spiral-galaxy' && <SpiralGalaxy />}
            {body.type === 'pulsar-a' && <Pulsar tone="coral" />}
            {body.type === 'pulsar-b' && <Pulsar tone="sand" />}
            {body.type === 'binary-star' && <BinaryStar />}
            {body.type === 'asteroid-a' && <Asteroid variant="a" />}
            {body.type === 'asteroid-b' && <Asteroid variant="b" />}
          </div>
        )
      })}
    </div>
  )
}

export const DeepSkyBodies = memo(DeepSkyBodiesComponent)
