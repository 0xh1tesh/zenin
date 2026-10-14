/** Shared orbit geometry: the SVG draws it, the scroll timeline moves the moons along it. */
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
  { rx: 330, ry: 96, speed: 1, start: 0.6, moonR: 9 },
  { rx: 460, ry: 134, speed: -0.6, start: 3.4, moonR: 6 },
]

export interface OrbitPoint {
  x: number
  y: number
  /** True on the near half of the orbit (in front of the planet). */
  front: boolean
}

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

export default function Orbits() {
  return (
    <div className="hero__orbits" aria-hidden="true">
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">
        {ORBITS.map((o, i) => (
          <ellipse
            key={`line-${i}`}
            className="hero__orbit-line"
            cx={ORBIT_CENTER}
            cy={ORBIT_CENTER}
            rx={o.rx}
            ry={o.ry}
            transform={`rotate(${ORBIT_TILT_DEG} ${ORBIT_CENTER} ${ORBIT_CENTER})`}
          />
        ))}
        {ORBITS.map((o, i) => {
          const p = orbitPoint(o, o.start)
          return <circle key={`moon-${i}`} className="hero__moon" data-orbit={i} cx={p.x} cy={p.y} r={o.moonR} />
        })}
      </svg>
    </div>
  )
}
