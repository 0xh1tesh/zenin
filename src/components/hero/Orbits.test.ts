import { describe, expect, it } from 'vitest'
import {
  ORBITS,
  ORBIT_CENTER,
  ORBIT_TILT_DEG,
  orbitPoint,
  buildTailPath,
  computeEllipsePerimeter,
  ellipseArcLength,
  computeOrbitDashOffset,
  getOrbitArcPaths,
} from './Orbits'

describe('ORBITS configuration', () => {
  it('defines three orbits including the inner satellite', () => {
    expect(ORBITS).toHaveLength(3)
  })

  it('has valid positive geometric properties and nonzero speeds', () => {
    for (const spec of ORBITS) {
      expect(spec.rx).toBeGreaterThan(0)
      expect(spec.ry).toBeGreaterThan(0)
      expect(spec.moonR).toBeGreaterThan(0)
      expect(spec.speed).not.toBe(0)
      expect(Number.isFinite(spec.start)).toBe(true)
    }
  })

  it('specifies the main moon with speed 1 and outer moon with negative counter-speed', () => {
    expect(ORBITS[0].speed).toBe(1)
    expect(ORBITS[1].speed).toBeLessThan(0)
    expect(ORBITS[2].speed).toBeGreaterThan(1.5) // Fast inner satellite
  })
})

describe('orbitPoint', () => {
  const spec = ORBITS[0]

  it('returns valid coordinates centered around ORBIT_CENTER', () => {
    const pt = orbitPoint(spec, 0)
    expect(Number.isFinite(pt.x)).toBe(true)
    expect(Number.isFinite(pt.y)).toBe(true)
    expect(typeof pt.front).toBe('boolean')
  })

  it('distinguishes near half (front=true) from far half (front=false)', () => {
    // Near half: sin(angle) > 0, e.g. angle = PI / 2
    const near = orbitPoint(spec, Math.PI / 2)
    expect(near.front).toBe(true)

    // Far half: sin(angle) < 0, e.g. angle = 3 * PI / 2
    const far = orbitPoint(spec, (3 * Math.PI) / 2)
    expect(far.front).toBe(false)
  })

  it('computes correct tilted coordinates for angle 0', () => {
    const pt = orbitPoint(spec, 0)
    const tilt = (ORBIT_TILT_DEG * Math.PI) / 180
    const expectedX = ORBIT_CENTER + spec.rx * Math.cos(tilt)
    const expectedY = ORBIT_CENTER + spec.rx * Math.sin(tilt)
    expect(pt.x).toBeCloseTo(expectedX, 3)
    expect(pt.y).toBeCloseTo(expectedY, 3)
  })
})

describe('buildTailPath', () => {
  it('builds an SVG path string starting with M and containing L steps', () => {
    const spec = ORBITS[0]
    const tail = buildTailPath(spec, 1.0, 0.45, 8)
    expect(tail.d).toMatch(/^M\s+[\d.-]+\s+[\d.-]+(\s+L\s+[\d.-]+\s+[\d.-]+)+$/)
    expect(tail.head).toEqual(orbitPoint(spec, 1.0))
  })

  it('trails behind the moon for positive speed orbits', () => {
    const spec = ORBITS[0] // speed: 1 (positive)
    const angle = 1.0
    const tailAngle = 0.4
    const tail = buildTailPath(spec, angle, tailAngle, 6)
    // Behind head means angle - tailAngle
    const expectedTailPt = orbitPoint(spec, angle - tailAngle)
    expect(tail.tail.x).toBeCloseTo(expectedTailPt.x, 1)
    expect(tail.tail.y).toBeCloseTo(expectedTailPt.y, 1)
  })

  it('trails behind the moon for negative speed orbits', () => {
    const spec = ORBITS[1] // speed: -0.6 (negative)
    const angle = 3.0
    const tailAngle = 0.5
    const tail = buildTailPath(spec, angle, tailAngle, 6)
    // Behind head for negative speed means angle + tailAngle
    const expectedTailPt = orbitPoint(spec, angle + tailAngle)
    expect(tail.tail.x).toBeCloseTo(expectedTailPt.x, 1)
    expect(tail.tail.y).toBeCloseTo(expectedTailPt.y, 1)
  })

  it('generates the specified number of segments', () => {
    const spec = ORBITS[2]
    const tail = buildTailPath(spec, 0.5, 0.3, 10)
    const lineToMatches = tail.d.match(/L/g)
    expect(lineToMatches).toHaveLength(10)
  })
})

describe('computeEllipsePerimeter', () => {
  it('matches 2 * PI * r for a circle where rx === ry', () => {
    const r = 100
    const perimeter = computeEllipsePerimeter(r, r)
    expect(perimeter).toBeCloseTo(2 * Math.PI * r, 3)
  })

  it('computes positive, plausible perimeters for all configured orbits', () => {
    for (const spec of ORBITS) {
      const p = computeEllipsePerimeter(spec.rx, spec.ry)
      // Perimeter is bounded between 2*PI*ry and 2*PI*rx
      expect(p).toBeGreaterThan(2 * Math.PI * spec.ry)
      expect(p).toBeLessThan(2 * Math.PI * spec.rx)
    }
  })
})

describe('ellipseArcLength', () => {
  it('returns 0 for theta = 0', () => {
    expect(ellipseArcLength(100, 50, 0)).toBe(0)
  })

  it('returns half perimeter for theta = PI on a circle', () => {
    const arcLen = ellipseArcLength(100, 100, Math.PI)
    expect(arcLen).toBeCloseTo(Math.PI * 100, 1)
  })

  it('monotonically increases between 0 and 2*PI', () => {
    const rx = 330
    const ry = 96
    const len1 = ellipseArcLength(rx, ry, 0.5)
    const len2 = ellipseArcLength(rx, ry, 1.5)
    const len3 = ellipseArcLength(rx, ry, 3.0)
    const len4 = ellipseArcLength(rx, ry, 5.0)

    expect(len1).toBeGreaterThan(0)
    expect(len2).toBeGreaterThan(len1)
    expect(len3).toBeGreaterThan(len2)
    expect(len4).toBeGreaterThan(len3)
  })
})

describe('computeOrbitDashOffset', () => {
  it('returns a finite number centered around dash length', () => {
    const offset = computeOrbitDashOffset(330, 96, 0, 50)
    expect(Number.isFinite(offset)).toBe(true)
    // At theta = 0, arcLen is 0, offset is - (0 - 50/2) = 25
    expect(offset).toBe(25)
  })
})

describe('getOrbitArcPaths', () => {
  it('returns top and bottom semicircular arc paths', () => {
    const spec = ORBITS[0]
    const { backD, frontD } = getOrbitArcPaths(spec)
    expect(backD).toContain('A 330,96 0 0,1')
    expect(frontD).toContain('A 330,96 0 0,1')
    expect(backD.startsWith(`M ${ORBIT_CENTER - spec.rx},${ORBIT_CENTER}`)).toBe(true)
    expect(frontD.startsWith(`M ${ORBIT_CENTER + spec.rx},${ORBIT_CENTER}`)).toBe(true)
  })
})
