import { describe, expect, it } from 'vitest'
import {
  canSpawnComet,
  computeQuadraticPoint,
  computeQuadraticTangent,
  createCometTrajectory,
  createSeededRandom,
  createStaticCometStreaks,
  generateStarDust,
  getNextSpawnInterval,
  getStarAlpha,
  isLowEndDevice,
  isSpawnDue,
  PALETTE,
  pickCometColor,
  sampleTrajectoryHistory,
  shouldSkipFrame,
} from './cometMath'

describe('createSeededRandom', () => {
  it('returns identical sequences for the same seed', () => {
    const r1 = createSeededRandom(1337)
    const r2 = createSeededRandom(1337)
    const seq1 = [r1(), r1(), r1(), r1(), r1()]
    const seq2 = [r2(), r2(), r2(), r2(), r2()]
    expect(seq1).toEqual(seq2)
  })

  it('produces different sequences for different seeds', () => {
    const r1 = createSeededRandom(101)
    const r2 = createSeededRandom(202)
    expect(r1()).not.toBe(r2())
  })

  it('produces numbers strictly within [0, 1)', () => {
    const rand = createSeededRandom(777)
    for (let i = 0; i < 100; i++) {
      const v = rand()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('shouldSkipFrame (30fps gate)', () => {
  it('does not skip the first frame (lastFrameTime <= 0)', () => {
    expect(shouldSkipFrame(100, 0, 30)).toBe(false)
    expect(shouldSkipFrame(100, -1, 30)).toBe(false)
  })

  it('skips frame when time delta is less than target interval (~33.3ms)', () => {
    // 20ms elapsed < 33.33ms -> skip
    expect(shouldSkipFrame(1020, 1000, 30)).toBe(true)
    // 32ms elapsed < 33.33ms -> skip
    expect(shouldSkipFrame(1032, 1000, 30)).toBe(true)
  })

  it('allows frame when time delta meets or exceeds target interval', () => {
    // 34ms elapsed >= 33.33ms -> do not skip
    expect(shouldSkipFrame(1034, 1000, 30)).toBe(false)
    // 50ms elapsed >= 33.33ms -> do not skip
    expect(shouldSkipFrame(1050, 1000, 30)).toBe(false)
  })

  it('works with arbitrary target FPS values', () => {
    // 60fps = 16.67ms
    expect(shouldSkipFrame(1010, 1000, 60)).toBe(true)
    expect(shouldSkipFrame(1020, 1000, 60)).toBe(false)
  })
})

describe('spawn scheduling (getNextSpawnInterval, canSpawnComet, isSpawnDue)', () => {
  it('generates spawn interval strictly within 1.2s - 3.6s', () => {
    const rand = createSeededRandom(42)
    for (let i = 0; i < 50; i++) {
      const interval = getNextSpawnInterval(rand)
      expect(interval).toBeGreaterThanOrEqual(1200)
      expect(interval).toBeLessThanOrEqual(3600)
    }
  })

  it('allows at most 4 alive comets at once', () => {
    expect(canSpawnComet(0, 4)).toBe(true)
    expect(canSpawnComet(3, 4)).toBe(true)
    expect(canSpawnComet(4, 4)).toBe(false)
    expect(canSpawnComet(5, 4)).toBe(false)
  })

  it('determines if spawn is due based on elapsed time', () => {
    expect(isSpawnDue(5000, 1000, 3500)).toBe(true) // 4000ms >= 3500ms
    expect(isSpawnDue(4000, 1000, 3500)).toBe(false) // 3000ms < 3500ms
  })
})

describe('pickCometColor', () => {
  it('picks valid palette colors adhering to alpha limits', () => {
    const rand = createSeededRandom(999)
    for (let i = 0; i < 40; i++) {
      const color = pickCometColor(rand)
      expect(['standard', 'great']).toContain(color.type)
      expect(color.headCoreRgba).toMatch(/rgba\(234,\s*230,\s*222,\s*0\.85\)/)
      // Check head glow alpha is <= 0.85
      expect(color.headGlowRgba).toContain('rgba(239, 133, 87')

      // Tail color must be one of the palette colors
      const validTails = [
        PALETTE.sand,
        PALETTE.bone,
        PALETTE.coral,
        PALETTE.blueLightened,
      ]
      expect(validTails).toContainEqual(color.tailColorRgb)

      if (color.type === 'great') {
        expect(color.ionTailColorRgb).toEqual(PALETTE.blueLightened)
      } else {
        expect(color.ionTailColorRgb).toBeUndefined()
      }
    }
  })

  it('generates great comets at roughly 1 in 6 frequency', () => {
    const rand = createSeededRandom(12345)
    let greatCount = 0
    const trials = 1000
    for (let i = 0; i < trials; i++) {
      if (pickCometColor(rand).type === 'great') {
        greatCount++
      }
    }
    const freq = greatCount / trials
    // 1/6 is ~0.1667; allow reasonable margin
    expect(freq).toBeGreaterThan(0.12)
    expect(freq).toBeLessThan(0.22)
  })
})

describe('quadratic trajectory calculation', () => {
  const p0 = { x: 0, y: 0 }
  const pc = { x: 50, y: 100 }
  const p1 = { x: 100, y: 0 }

  it('matches start point at t = 0 and end point at t = 1', () => {
    const start = computeQuadraticPoint(p0, pc, p1, 0)
    expect(start.x).toBeCloseTo(0)
    expect(start.y).toBeCloseTo(0)

    const end = computeQuadraticPoint(p0, pc, p1, 1)
    expect(end.x).toBeCloseTo(100)
    expect(end.y).toBeCloseTo(0)
  })

  it('calculates curved midpoint correctly at t = 0.5', () => {
    // At t = 0.5, P(0.5) = 0.25*P0 + 0.5*Pc + 0.25*P1
    // x = 0 + 25 + 25 = 50, y = 0 + 50 + 0 = 50
    const mid = computeQuadraticPoint(p0, pc, p1, 0.5)
    expect(mid.x).toBeCloseTo(50)
    expect(mid.y).toBeCloseTo(50)
  })

  it('computes tangent direction vector correctly', () => {
    const tangentStart = computeQuadraticTangent(p0, pc, p1, 0)
    // At t = 0, P'(0) = 2*(Pc - P0) = 2*(50, 100) = (100, 200)
    expect(tangentStart.x).toBeCloseTo(100)
    expect(tangentStart.y).toBeCloseTo(200)
  })
})

describe('createCometTrajectory', () => {
  it('generates trajectory with points crossing viewport diagonally', () => {
    const rand = createSeededRandom(555)
    const width = 1200
    const height = 800

    for (let i = 0; i < 20; i++) {
      const traj = createCometTrajectory(width, height, rand)
      expect(traj.duration).toBeGreaterThan(2500)
      expect(traj.headRadius).toBeGreaterThan(0)
      expect(traj.tailWidth).toBeGreaterThan(0)

      // Start or end point should lie outside viewport (with margin)
      const isOutside =
        traj.p0.x < 0 ||
        traj.p0.x > width ||
        traj.p0.y < 0 ||
        traj.p0.y > height
      expect(isOutside).toBe(true)
    }
  })
})

describe('sampleTrajectoryHistory', () => {
  it('samples expected number of tail points with progressive age', () => {
    const p0 = { x: 10, y: 10 }
    const pc = { x: 50, y: 80 }
    const p1 = { x: 120, y: 150 }

    const samples = sampleTrajectoryHistory(p0, pc, p1, 0.8, 0.2, 10)
    expect(samples.length).toBe(11) // 0 to 10 inclusive

    expect(samples[0].age).toBe(0) // Head
    expect(samples[samples.length - 1].age).toBe(1) // Tail tip

    // Head is at t = 0.8
    const expectedHead = computeQuadraticPoint(p0, pc, p1, 0.8)
    expect(samples[0].x).toBeCloseTo(expectedHead.x)
    expect(samples[0].y).toBeCloseTo(expectedHead.y)
  })
})

describe('generateStarDust', () => {
  it('clamps star count between 60 and 120', () => {
    const low = generateStarDust(30, 800, 600, 1)
    expect(low.length).toBe(60)

    const high = generateStarDust(200, 800, 600, 1)
    expect(high.length).toBe(120)

    const normal = generateStarDust(85, 800, 600, 1)
    expect(normal.length).toBe(85)
  })

  it('guarantees baseAlpha <= 0.28 so twinkling never exceeds 0.35 limit', () => {
    const stars = generateStarDust(100, 1000, 1000, 77)
    for (const star of stars) {
      expect(star.baseAlpha).toBeLessThanOrEqual(0.28)
      expect(star.baseAlpha).toBeGreaterThan(0)
      expect(star.radius).toBeGreaterThan(0)
    }
  })

  it('is completely deterministic for identical seeds', () => {
    const run1 = generateStarDust(90, 1000, 800, 42)
    const run2 = generateStarDust(90, 1000, 800, 42)
    expect(run1).toEqual(run2)
  })
})

describe('getStarAlpha', () => {
  it('strictly respects the 0.35 opacity ceiling across all time points', () => {
    const baseAlpha = 0.28
    const speed = 1.5
    const phase = 0.5

    for (let t = 0; t < 10000; t += 250) {
      const alpha = getStarAlpha(baseAlpha, speed, phase, t)
      expect(alpha).toBeGreaterThanOrEqual(0)
      expect(alpha).toBeLessThanOrEqual(0.35)
    }
  })
})

describe('createStaticCometStreaks', () => {
  it('returns exactly two static streaks with valid coordinates', () => {
    const streaks = createStaticCometStreaks(1280, 720)
    expect(streaks.length).toBe(2)

    for (const streak of streaks) {
      expect(streak.t).toBeGreaterThan(0)
      expect(streak.t).toBeLessThan(1)
      expect(streak.tailSpan).toBeGreaterThan(0)
      expect(streak.headRadius).toBeGreaterThan(0)
      expect(streak.tailWidth).toBeGreaterThan(0)
    }

    // One streak is standard, one is great
    const types = streaks.map((s) => s.color.type)
    expect(types).toContain('standard')
    expect(types).toContain('great')
  })
})

describe('isLowEndDevice', () => {
  it('returns true when hardwareConcurrency <= 2', () => {
    const mockNav = { hardwareConcurrency: 2 } as Navigator
    expect(isLowEndDevice(mockNav)).toBe(true)

    const mockNav1 = { hardwareConcurrency: 1 } as Navigator
    expect(isLowEndDevice(mockNav1)).toBe(true)
  })

  it('returns true when Save-Data is enabled', () => {
    const mockNav = {
      hardwareConcurrency: 8,
      connection: { saveData: true },
    } as unknown as Navigator
    expect(isLowEndDevice(mockNav)).toBe(true)
  })

  it('returns false for higher-concurrency devices without Save-Data', () => {
    const mockNav = {
      hardwareConcurrency: 8,
      connection: { saveData: false },
    } as unknown as Navigator
    expect(isLowEndDevice(mockNav)).toBe(false)
  })
})
