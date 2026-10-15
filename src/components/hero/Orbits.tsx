/**
 * Shared orbit geometry and SVG rendering for Zenin '26 celestial hero.
 * Renders two stacked SVGs (back layer behind planet, front layer in front of planet)
 * so that moons and orbit lines achieve genuine 3D occlusion depth.
 */
export interface OrbitSpec {
  rx: number
  ry: number
  /** Angular speed multiplier (negative = counter-clockwise). */
  speed: number
  /** Start angle in radians. */
  start: number
  moonR: number
}

export const ORBIT_CENTER = 500
export const ORBIT_TILT_DEG = -16

export const ORBITS: readonly OrbitSpec[] = [
  { rx: 330, ry: 96, speed: 1, start: 0.6, moonR: 18 },
  { rx: 460, ry: 134, speed: -0.6, start: 3.4, moonR: 13 },
  { rx: 210, ry: 62, speed: 2.2, start: 1.8, moonR: 6 },
]

export interface OrbitPoint {
  x: number
  y: number
  /** True on the near half of the orbit (in front of the planet). */
  front: boolean
}

/** Computes the point in 1000x1000 tilted SVG space for a given angle in radians. */
export function orbitPoint(spec: OrbitSpec, angle: number): OrbitPoint {
  const tilt = (ORBIT_TILT_DEG * Math.PI) / 180
  const px = spec.rx * Math.cos(angle)
  const py = spec.ry * Math.sin(angle)
  return {
    x: ORBIT_CENTER + px * Math.cos(tilt) - py * Math.sin(tilt),
    y: ORBIT_CENTER + px * Math.sin(tilt) + py * Math.cos(tilt),
    front: Math.sin(angle) > 0,
  }
}

/** Builds an SVG path string that curves along the ellipse trailing behind the moon. */
export function buildTailPath(
  spec: OrbitSpec,
  currentAngle: number,
  tailAngle = 0.45,
  steps = 8,
): { d: string; head: OrbitPoint; tail: OrbitPoint } {
  const dir = spec.speed >= 0 ? 1 : -1
  const head = orbitPoint(spec, currentAngle)
  const tail = orbitPoint(spec, currentAngle - dir * tailAngle)
  let d = `M ${head.x.toFixed(1)} ${head.y.toFixed(1)}`
  for (let s = 1; s <= steps; s++) {
    const a = currentAngle - dir * (s / steps) * tailAngle
    const p = orbitPoint(spec, a)
    d += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  }
  return { d, head, tail }
}

/** Computes the perimeter of an ellipse using Ramanujan's high-precision approximation. */
export function computeEllipsePerimeter(rx: number, ry: number): number {
  const h = Math.pow((rx - ry) / (rx + ry), 2)
  return Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)))
}

/** Computes the arc length from angle 0 to theta along an unrotated ellipse. */
export function ellipseArcLength(rx: number, ry: number, theta: number): number {
  const twoPi = Math.PI * 2
  let norm = theta % twoPi
  if (norm < 0) norm += twoPi
  if (norm === 0 && theta > 0) norm = twoPi
  const steps = 16
  const dt = norm / steps
  let length = 0
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) * dt
    const dx = -rx * Math.sin(t)
    const dy = ry * Math.cos(t)
    length += Math.sqrt(dx * dx + dy * dy) * dt
  }
  return length
}

/** Computes the stroke-dashoffset to center a dash of dashLength around the moon. */
export function computeOrbitDashOffset(
  rx: number,
  ry: number,
  angle: number,
  dashLength = 50,
): number {
  const arcLen = ellipseArcLength(rx, ry, angle)
  return -(arcLen - dashLength / 2)
}

/** Splits the orbit ellipse into back arc (top) and front arc (bottom) for 3D depth. */
export function getOrbitArcPaths(spec: OrbitSpec): { backD: string; frontD: string } {
  const cx = ORBIT_CENTER
  const cy = ORBIT_CENTER
  const { rx, ry } = spec
  return {
    backD: `M ${cx - rx},${cy} A ${rx},${ry} 0 0,1 ${cx + rx},${cy}`,
    frontD: `M ${cx + rx},${cy} A ${rx},${ry} 0 0,1 ${cx - rx},${cy}`,
  }
}

interface OrbitLayerProps {
  layer: 'back' | 'front'
}

function OrbitSvg({ layer }: OrbitLayerProps) {
  const isBack = layer === 'back'

  return (
    <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">
      <defs>
        {isBack && (
          <>
            <filter
              id="hero-moon-glow"
              filterUnits="userSpaceOnUse"
              x="-200"
              y="-200"
              width="1400"
              height="1400"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <radialGradient id="hero-halo-grad">
              <stop offset="0%" stopColor="#ef8557" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#d5360c" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#d5360c" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="hero-moon-grad-0" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#eae6de" />
              <stop offset="35%" stopColor="#e6d5bd" />
              <stop offset="70%" stopColor="#ef8557" />
              <stop offset="100%" stopColor="#d5360c" />
            </radialGradient>

            <radialGradient id="hero-moon-grad-1" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#eae6de" />
              <stop offset="30%" stopColor="#e6d5bd" />
              <stop offset="75%" stopColor="#ef8557" />
              <stop offset="100%" stopColor="#d5360c" />
            </radialGradient>

            <radialGradient id="hero-moon-grad-2" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#eae6de" />
              <stop offset="50%" stopColor="#ef8557" />
              <stop offset="100%" stopColor="#d5360c" />
            </radialGradient>
          </>
        )}

        {ORBITS.map((o, i) => {
          const initTail = buildTailPath(o, o.start, 0.45, 8)
          return (
            <linearGradient
              key={`tail-grad-${layer}-${i}`}
              id={`hero-tail-grad-${layer}-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={initTail.head.x}
              y1={initTail.head.y}
              x2={initTail.tail.x}
              y2={initTail.tail.y}
            >
              <stop
                offset="0%"
                stopColor={i === 2 ? '#ef8557' : i === 1 ? '#e6d5bd' : '#eae6de'}
                stopOpacity="0.85"
              />
              <stop offset="30%" stopColor="#ef8557" stopOpacity="0.55" />
              <stop offset="70%" stopColor="#d5360c" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#d5360c" stopOpacity="0" />
            </linearGradient>
          )
        })}
      </defs>

      {/* Orbit track arc lines */}
      {ORBITS.map((o, i) => {
        const arcs = getOrbitArcPaths(o)
        const d = isBack ? arcs.backD : arcs.frontD
        return (
          <path
            key={`orbit-arc-${layer}-${i}`}
            className={`hero__orbit-line hero__orbit-line--${i}`}
            d={d}
            transform={`rotate(${ORBIT_TILT_DEG} ${ORBIT_CENTER} ${ORBIT_CENTER})`}
          />
        )
      })}

      {/* Dynamic tracking highlight dash on the orbit line */}
      {ORBITS.map((o, i) => {
        const p = orbitPoint(o, o.start)
        const isVisible = isBack ? !p.front : p.front
        const perim = computeEllipsePerimeter(o.rx, o.ry)
        const offset = computeOrbitDashOffset(o.rx, o.ry, o.start, 50)
        return (
          <ellipse
            key={`highlight-${layer}-${i}`}
            className={`hero__orbit-highlight hero__orbit-highlight--${i}`}
            data-highlight={i}
            data-layer={layer}
            cx={ORBIT_CENTER}
            cy={ORBIT_CENTER}
            rx={o.rx}
            ry={o.ry}
            strokeDasharray={`50 ${Math.round(perim)}`}
            strokeDashoffset={offset}
            transform={`rotate(${ORBIT_TILT_DEG} ${ORBIT_CENTER} ${ORBIT_CENTER})`}
            style={{ display: isVisible ? '' : 'none' }}
          />
        )
      })}

      {/* Glowing comet trails curving with the orbit */}
      {ORBITS.map((o, i) => {
        const p = orbitPoint(o, o.start)
        const isVisible = isBack ? !p.front : p.front
        const tail = buildTailPath(o, o.start, 0.45, 8)
        return (
          <path
            key={`tail-${layer}-${i}`}
            className={`hero__moon-tail hero__moon-tail--${i}`}
            data-tail={i}
            data-layer={layer}
            d={tail.d}
            stroke={`url(#hero-tail-grad-${layer}-${i})`}
            strokeWidth={o.moonR * 1.3}
            strokeLinecap="round"
            style={{ display: isVisible ? '' : 'none' }}
          />
        )
      })}

      {/* Moons and satellite bodies */}
      {ORBITS.map((o, i) => {
        const p = orbitPoint(o, o.start)
        const isVisible = isBack ? !p.front : p.front
        return (
          <g
            key={`moon-${layer}-${i}`}
            className={`hero__moon-wrap hero__moon-wrap--${i}`}
            data-orbit={i}
            data-layer={layer}
            transform={`translate(${p.x}, ${p.y})`}
            style={{ display: isVisible ? '' : 'none' }}
          >
            {/* Pulsing ring on main and outer moons (front layer only) */}
            {!isBack && i !== 2 && (
              <circle
                className={`hero__moon-pulse ${i === 1 ? 'hero__moon-pulse--outer' : ''}`}
                cx={0}
                cy={0}
                r={o.moonR * 1.5}
              />
            )}

            {/* Soft halo glow */}
            <circle
              className="hero__moon-halo"
              cx={0}
              cy={0}
              r={o.moonR * 3}
              fill="url(#hero-halo-grad)"
            />

            {/* Moon body with radial gradient */}
            <circle
              className={`hero__moon hero__moon-body hero__moon-body--${i}`}
              cx={0}
              cy={0}
              r={o.moonR}
              fill={`url(#hero-moon-grad-${i})`}
            />

            {/* Blinking coral beacon light on satellite */}
            {i === 2 && <circle className="hero__satellite-beacon" cx={0} cy={0} r={2.4} />}

            {/* 4-point lens flare sparkle on main moon near front-most orbital point */}
            {!isBack && i === 0 && (
              <g className="hero__moon-sparkle" data-moon-sparkle opacity="0">
                <path
                  d="M 0,-16 Q 0,0 16,0 Q 0,0 0,16 Q 0,0 -16,0 Q 0,0 0,-16 Z"
                  fill="#eae6de"
                />
                <circle cx={0} cy={0} r={2.2} fill="#eae6de" />
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default function Orbits() {
  return (
    <>
      <div className="hero__orbits hero__orbits--back" aria-hidden="true">
        <OrbitSvg layer="back" />
      </div>
      <div className="hero__orbits hero__orbits--front" aria-hidden="true">
        <OrbitSvg layer="front" />
      </div>
    </>
  )
}
