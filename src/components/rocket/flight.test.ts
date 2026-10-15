import { describe, expect, it } from 'vitest'
import {
  calculateScrollProgress,
  computeFlameScale,
  computePathDimensions,
  computePathPoint,
  computePathTangent,
  computeRocketAngle,
  generateSvgPathString,
  isLanded,
  LANDING_THRESHOLD,
  lerp,
  lerpAngle,
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
    expect(dims.centerOffset).toBe(22)
    expect(dims.amplitude).toBeLessThanOrEqual(12)
    // Must clear bottom nav and topbar
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
    // at p=0, cos(0) = 1, so dx = amplitude * 2 * pi * waves
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
    // Slight rightward tangent (dx > 0)
    const angleDown = computeRocketAngle(50, 500, false)
    expect(angleDown).toBeLessThan(180) // banked to match curve

    const angleUp = computeRocketAngle(50, 500, true)
    expect(angleUp).toBeLessThan(0)
  })
})

describe('lerpAngle', () => {
  it('interpolates smoothly across 0/360 boundary', () => {
    const angle = lerpAngle(350, 10, 0.5)
    // Direct diff is -340, but shortest diff is +20, so 350 + 10 = 360 (= 0)
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
