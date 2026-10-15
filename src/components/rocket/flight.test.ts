import { describe, expect, it } from 'vitest'
import {
  calculateScrollProgress,
  calculateWaypointProgress,
  checkCraftClearance,
  computeFlameScale,
  computePathDimensions,
  computePathPoint,
  computePathTangent,
  computeReentryHeat,
  computeRocketAngle,
  computeSeparationState,
  formatAltitude,
  generateSvgPathString,
  getActiveSectionTitle,
  isLanded,
  LANDING_THRESHOLD,
  lerp,
  lerpAngle,
  REENTRY_START_PROGRESS,
  SEPARATION_DOWN_THRESHOLD,
  SEPARATION_UP_THRESHOLD,
  shouldEmitParticle,
  smoothVelocity,
} from './flight'

describe('calculateScrollProgress', () => {
  it('returns 0 when at the very top of the page', () => {
    expect(calculateScrollProgress(0, 3000, 1000)).toBe(0)
  })

  it('returns 0.5 when halfway through scrollable range', () => {
    expect(calculateScrollProgress(1000, 3000, 1000)).toBe(0.5)
  })

  it('returns 1 when at the bottom of the page', () => {
    expect(calculateScrollProgress(2000, 3000, 1000)).toBe(1)
  })

  it('returns 0 if page is not scrollable (scrollHeight <= innerHeight)', () => {
    expect(calculateScrollProgress(0, 800, 1000)).toBe(0)
    expect(calculateScrollProgress(50, 1000, 1000)).toBe(0)
  })

  it('clamps negative scroll (e.g. rubber-banding) to 0', () => {
    expect(calculateScrollProgress(-120, 3000, 1000)).toBe(0)
  })

  it('clamps overscroll beyond bottom to 1', () => {
    expect(calculateScrollProgress(2500, 3000, 1000)).toBe(1)
  })
})

describe('computePathDimensions', () => {
  it('computes mobile corridor dimensions (<= 44px wide)', () => {
    const dims = computePathDimensions(375, 667, true)
    expect(dims.overlayWidth).toBeLessThanOrEqual(44)
    expect(dims.overlayWidth).toBe(44)
    expect(dims.centerOffset).toBe(16)
    expect(dims.amplitude).toBe(4.5)
    expect(dims.topOffset).toBeGreaterThanOrEqual(68)
    expect(dims.bottomOffset).toBeGreaterThanOrEqual(80)
    expect(dims.trackHeight).toBe(667 - dims.topOffset - dims.bottomOffset)
  })

  it('computes desktop corridor dimensions', () => {
    const dims = computePathDimensions(1280, 900, false)
    expect(dims.overlayWidth).toBeGreaterThan(60)
    expect(dims.overlayWidth).toBeLessThanOrEqual(110)
    expect(dims.trackHeight).toBe(900 - dims.topOffset - dims.bottomOffset)
  })
})

describe('computePathPoint', () => {
  const desktopDims = computePathDimensions(1200, 800, false)

  it('starts at (centerOffset, topOffset) at progress 0', () => {
    const pt = computePathPoint(0, desktopDims)
    expect(pt.x).toBeCloseTo(desktopDims.centerOffset, 2)
    expect(pt.y).toBeCloseTo(desktopDims.topOffset, 2)
  })

  it('ends at (centerOffset, topOffset + trackHeight) at progress 1', () => {
    const pt = computePathPoint(1, desktopDims)
    expect(pt.x).toBeCloseTo(desktopDims.centerOffset, 2)
    expect(pt.y).toBeCloseTo(desktopDims.topOffset + desktopDims.trackHeight, 2)
  })

  it('keeps x within amplitude bounds at all intermediate progress points', () => {
    for (let i = 0; i <= 20; i++) {
      const p = i / 20
      const pt = computePathPoint(p, desktopDims)
      expect(pt.x).toBeGreaterThanOrEqual(desktopDims.centerOffset - desktopDims.amplitude - 0.01)
      expect(pt.x).toBeLessThanOrEqual(desktopDims.centerOffset + desktopDims.amplitude + 0.01)
    }
  })

  it('clamps p < 0 and p > 1', () => {
    const ptLow = computePathPoint(-0.5, desktopDims)
    const ptZero = computePathPoint(0, desktopDims)
    expect(ptLow.x).toBe(ptZero.x)
    expect(ptLow.y).toBe(ptZero.y)

    const ptHigh = computePathPoint(1.5, desktopDims)
    const ptOne = computePathPoint(1, desktopDims)
    expect(ptHigh.x).toBe(ptOne.x)
    expect(ptHigh.y).toBe(ptOne.y)
  })
})

describe('computePathTangent', () => {
  const dims = computePathDimensions(1024, 768, false)

  it('has a positive downward dy component', () => {
    const tangent = computePathTangent(0.3, dims)
    expect(tangent.dy).toBeGreaterThan(0)
    expect(tangent.dy).toBe(dims.trackHeight)
  })

  it('computes exact cosine derivative for dx', () => {
    const t0 = computePathTangent(0, dims)
    const expectedDx = dims.amplitude * 2 * Math.PI * dims.waves
    expect(t0.dx).toBeCloseTo(expectedDx, 4)
  })
})

describe('computeRocketAngle', () => {
  it('points downward (~180 deg) when scrolling down', () => {
    const angle = computeRocketAngle(0, 500, false)
    expect(angle).toBe(180)
  })

  it('flips to point upward (~0 deg) when scrolling up', () => {
    const angle = computeRocketAngle(0, 500, true)
    expect(angle).toBe(0)
  })

  it('tilts according to trajectory bank angle', () => {
    const angleDown = computeRocketAngle(50, 500, false)
    expect(angleDown).toBeLessThan(180)

    const angleUp = computeRocketAngle(50, 500, true)
    expect(angleUp).toBeLessThan(0)
  })
})

describe('lerpAngle', () => {
  it('interpolates smoothly across 0/360 boundary', () => {
    const angle = lerpAngle(350, 10, 0.5)
    expect(angle).toBe(360)
  })

  it('interpolates standard angles', () => {
    expect(lerpAngle(0, 180, 0.5)).toBe(90)
    expect(lerpAngle(180, 0, 0.5)).toBe(90)
  })
})

describe('lerp', () => {
  it('linearly interpolates numbers', () => {
    expect(lerp(0, 100, 0.25)).toBe(25)
    expect(lerp(50, 100, 0.5)).toBe(75)
  })
})

describe('smoothVelocity', () => {
  it('smooths velocity changes using exponential moving average', () => {
    const v1 = smoothVelocity(0, 10, 0.5)
    expect(v1).toBe(5)
    const v2 = smoothVelocity(v1, 0, 0.5)
    expect(v2).toBe(2.5)
  })
})

describe('isLanded', () => {
  it('returns false when progress is below threshold', () => {
    expect(isLanded(0)).toBe(false)
    expect(isLanded(0.5)).toBe(false)
    expect(isLanded(0.98)).toBe(false)
  })

  it('returns true when progress reaches or exceeds threshold', () => {
    expect(isLanded(LANDING_THRESHOLD)).toBe(true)
    expect(isLanded(0.99)).toBe(true)
    expect(isLanded(1.0)).toBe(true)
  })
})

describe('computeFlameScale', () => {
  it('provides idle scale and opacity when velocity is 0', () => {
    const flame = computeFlameScale(0, false)
    expect(flame.scaleY).toBeCloseTo(0.65, 2)
    expect(flame.opacity).toBeCloseTo(0.75, 2)
  })

  it('scales up with increased velocity', () => {
    const flame = computeFlameScale(2.0, false)
    expect(flame.scaleY).toBeGreaterThan(1.5)
    expect(flame.opacity).toBe(1.0)
  })

  it('completely cuts flame when landed', () => {
    const flame = computeFlameScale(1.0, true)
    expect(flame.scaleY).toBe(0)
    expect(flame.scaleX).toBe(0)
    expect(flame.opacity).toBe(0)
  })

  it('boosts flame to full thrust when launching again', () => {
    const flame = computeFlameScale(0, true, true)
    expect(flame.scaleY).toBeGreaterThan(2.0)
    expect(flame.opacity).toBe(1.0)
  })
})

describe('generateSvgPathString', () => {
  const dims = computePathDimensions(800, 600, false)

  it('creates a non-empty valid SVG path string starting with M', () => {
    const pathD = generateSvgPathString(dims, 10)
    expect(pathD.startsWith('M')).toBe(true)
    expect(pathD.includes('L')).toBe(true)
  })

  it('handles small step count gracefully', () => {
    expect(generateSvgPathString(dims, 1)).toBe('')
  })
})

describe('shouldEmitParticle', () => {
  it('does not emit particles when landed', () => {
    expect(shouldEmitParticle(2.0, true, false, 0, 16)).toBe(false)
  })

  it('does not emit particles when particle pool is full', () => {
    expect(shouldEmitParticle(2.0, false, false, 16, 16)).toBe(false)
  })

  it('does not emit particles when velocity is below threshold', () => {
    expect(shouldEmitParticle(0.1, false, false, 2, 16)).toBe(false)
  })

  it('emits particles when moving fast enough and capacity remains', () => {
    expect(shouldEmitParticle(1.0, false, false, 2, 16)).toBe(true)
    expect(shouldEmitParticle(0.5, false, true, 2, 6)).toBe(true)
  })
})

/* ─── NEW FEATURE PURE HELPERS ────────────────────────────────────────── */

describe('calculateWaypointProgress', () => {
  it('maps heading reaching viewport midpoint to normalized progress', () => {
    // Page with innerHeight = 800, maxScroll = 2400
    // Heading at top = 1600. When scrollY = (1600 - 400) = 1200, heading is at viewport center.
    // Progress = 1200 / 2400 = 0.5
    const p = calculateWaypointProgress(1600, 800, 2400)
    expect(p).toBeCloseTo(0.5, 4)
  })

  it('returns 0 when heading is near top of page (below midpoint)', () => {
    const p = calculateWaypointProgress(200, 800, 2400)
    expect(p).toBe(0)
  })

  it('clamps overscroll beyond maxScroll to 1', () => {
    const p = calculateWaypointProgress(4000, 800, 2400)
    expect(p).toBe(1)
  })

  it('handles unscrollable document gracefully', () => {
    expect(calculateWaypointProgress(500, 800, 0)).toBe(0)
  })
})

describe('formatAltitude', () => {
  it('starts at max altitude (400 KM) at progress 0', () => {
    expect(formatAltitude(0)).toBe('ALT 400 KM')
  })

  it('counts down to 200 KM at progress 0.5', () => {
    expect(formatAltitude(0.5)).toBe('ALT 200 KM')
  })

  it('reaches 0 KM at touchdown progress 1', () => {
    expect(formatAltitude(1)).toBe('ALT 0 KM')
  })

  it('clamps values out of [0, 1] range', () => {
    expect(formatAltitude(-0.2)).toBe('ALT 400 KM')
    expect(formatAltitude(1.2)).toBe('ALT 0 KM')
  })
})

describe('getActiveSectionTitle', () => {
  const beacons = [
    { id: 'b1', title: 'SCHEDULE', progress: 0.2 },
    { id: 'b2', title: 'KEYNOTES', progress: 0.5 },
    { id: 'b3', title: 'REGISTRATION', progress: 0.8 },
  ]

  it('returns fallback title before first beacon is reached', () => {
    expect(getActiveSectionTitle(beacons, 0.1, 'ORBIT')).toBe('ORBIT')
  })

  it('returns the title of the latest passed beacon', () => {
    expect(getActiveSectionTitle(beacons, 0.2)).toBe('SCHEDULE')
    expect(getActiveSectionTitle(beacons, 0.49)).toBe('SCHEDULE')
    expect(getActiveSectionTitle(beacons, 0.5)).toBe('KEYNOTES')
    expect(getActiveSectionTitle(beacons, 0.85)).toBe('REGISTRATION')
  })
})

describe('computeSeparationState with hysteresis', () => {
  it('remains attached when scrolling down below 0.50', () => {
    expect(computeSeparationState(0.0, false)).toBe(false)
    expect(computeSeparationState(0.49, false)).toBe(false)
  })

  it('detaches booster stage when crossing 0.50 going down', () => {
    expect(computeSeparationState(SEPARATION_DOWN_THRESHOLD, false)).toBe(true)
    expect(computeSeparationState(0.55, false)).toBe(true)
  })

  it('preserves separated state in the hysteresis window [0.45, 0.50]', () => {
    expect(computeSeparationState(0.48, true)).toBe(true)
    expect(computeSeparationState(0.46, true)).toBe(true)
  })

  it('restores booster stage when scrolling back above 0.45', () => {
    expect(computeSeparationState(SEPARATION_UP_THRESHOLD, true)).toBe(false)
    expect(computeSeparationState(0.4, true)).toBe(false)
    expect(computeSeparationState(0.0, true)).toBe(false)
  })
})

describe('computeReentryHeat', () => {
  it('returns 0 when progress is before re-entry zone (< 0.85)', () => {
    expect(computeReentryHeat(0.5, 1.0)).toBe(0)
    expect(computeReentryHeat(0.84, 1.5)).toBe(0)
  })

  it('scales heat factor with progress and velocity during final 15%', () => {
    const heat1 = computeReentryHeat(REENTRY_START_PROGRESS, 1.0)
    expect(heat1).toBe(0)

    const heat2 = computeReentryHeat(0.92, 1.0)
    expect(heat2).toBeGreaterThan(0)
    expect(heat2).toBeLessThanOrEqual(1.0)

    const heatHighVel = computeReentryHeat(0.95, 2.0)
    const heatLowVel = computeReentryHeat(0.95, 0.2)
    expect(heatHighVel).toBeGreaterThan(heatLowVel)
  })

  it('resets heat to 0 once landed', () => {
    expect(computeReentryHeat(0.99, 1.0, REENTRY_START_PROGRESS, true)).toBe(0)
  })
})

describe('checkCraftClearance (HARD CONSTRAINT a: >= 8px from right viewport edge)', () => {
  const craftDesktop = { width: 28, height: 48 }
  const craftMobile = { width: 22, height: 38 }

  it('guarantees >= 8px clearance at 375px mobile viewport', () => {
    const dims = computePathDimensions(375, 667, true)
    const clearance = checkCraftClearance(dims, craftMobile.width, craftMobile.height, 8)
    expect(clearance.isWithinBounds).toBe(true)
    expect(clearance.rightClearance).toBeGreaterThanOrEqual(8)
    expect(clearance.maxRightExtent).toBeLessThanOrEqual(dims.overlayWidth - 8)
  })

  it('guarantees >= 8px clearance at 768px tablet viewport', () => {
    const dims = computePathDimensions(768, 1024, false)
    const clearance = checkCraftClearance(dims, craftDesktop.width, craftDesktop.height, 8)
    expect(clearance.isWithinBounds).toBe(true)
    expect(clearance.rightClearance).toBeGreaterThanOrEqual(8)
    expect(clearance.maxRightExtent).toBeLessThanOrEqual(dims.overlayWidth - 8)
  })

  it('guarantees >= 8px clearance at 1280px desktop viewport', () => {
    const dims = computePathDimensions(1280, 800, false)
    const clearance = checkCraftClearance(dims, craftDesktop.width, craftDesktop.height, 8)
    expect(clearance.isWithinBounds).toBe(true)
    expect(clearance.rightClearance).toBeGreaterThanOrEqual(8)
    expect(clearance.maxRightExtent).toBeLessThanOrEqual(dims.overlayWidth - 8)
  })

  it('guarantees >= 8px clearance at 1440px wide desktop viewport', () => {
    const dims = computePathDimensions(1440, 900, false)
    const clearance = checkCraftClearance(dims, craftDesktop.width, craftDesktop.height, 8)
    expect(clearance.isWithinBounds).toBe(true)
    expect(clearance.rightClearance).toBeGreaterThanOrEqual(8)
    expect(clearance.maxRightExtent).toBeLessThanOrEqual(dims.overlayWidth - 8)
  })
})
