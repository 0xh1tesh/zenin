import { describe, expect, it } from 'vitest'
import { distanceToRect, repelOffset } from './cursorSkyMath'

const rect = { left: 100, top: 100, right: 200, bottom: 150 }

describe('distanceToRect', () => {
  it('is zero when the point is inside the rectangle', () => {
    expect(distanceToRect(150, 120, rect)).toBe(0)
  })

  it('measures straight out from an edge', () => {
    expect(distanceToRect(150, 60, rect)).toBe(40)
    expect(distanceToRect(230, 120, rect)).toBe(30)
  })

  it('measures diagonally from a corner', () => {
    expect(distanceToRect(203, 154, rect)).toBeCloseTo(5)
  })
})

describe('repelOffset', () => {
  it('leaves stars outside the reach alone', () => {
    expect(repelOffset(0, 0, 200, 0, 130, 16)).toBeNull()
  })

  it('pushes a star directly away from the cursor', () => {
    const offset = repelOffset(0, 0, 50, 0, 130, 16)
    expect(offset).not.toBeNull()
    expect(offset!.x).toBeGreaterThan(0)
    expect(offset!.y).toBeCloseTo(0)
  })

  it('pushes harder the closer the cursor is', () => {
    const near = repelOffset(0, 0, 20, 0, 130, 16)!
    const far = repelOffset(0, 0, 110, 0, 130, 16)!
    expect(near.x).toBeGreaterThan(far.x)
    expect(near.x).toBeLessThanOrEqual(16)
  })

  it('nudges upward when the cursor sits exactly on the star', () => {
    expect(repelOffset(10, 10, 10, 10, 130, 16)).toEqual({ x: 0, y: -16 })
  })
})
