/**
 * Pure mathematics and deterministic simulation helpers for CometSky.
 * Spawn scheduling, trajectory calculations, tail sampling, color selection,
 * seeded PRNG, and 30fps gating.
 */

export interface Point2D {
  x: number
  y: number
}

export type CometType = 'standard' | 'great'
export type RgbTriple = readonly [number, number, number]

export interface CometColorConfig {
  type: CometType
  headCoreRgba: string
  headGlowRgba: string
  tailColorRgb: RgbTriple
  ionTailColorRgb?: RgbTriple
}

export interface StarDustPoint {
  x: number
  y: number
  radius: number
  baseAlpha: number // strictly <= 0.28 (ensures twinkle <= 0.35)
  twinkleSpeed: number
  phase: number
  colorRgb: RgbTriple
}

export interface TrajectoryConfig {
  p0: Point2D
  pc: Point2D
  p1: Point2D
  duration: number
  color: CometColorConfig
  headRadius: number
  tailWidth: number
}

export interface TailSample {
  x: number
  y: number
  age: number
}

export interface StaticCometStreak {
  p0: Point2D
  pc: Point2D
  p1: Point2D
  t: number
  tailSpan: number
  color: CometColorConfig
  headRadius: number
  tailWidth: number
}

// Render72 Palette RGB values
export const PALETTE = {
  void: [16, 16, 16] as const,
  bone: [234, 230, 222] as const,
  sand: [230, 213, 189] as const,
  coral: [239, 133, 87] as const,
  blueLightened: [78, 139, 191] as const,
}

/** Creates a deterministic 32-bit PRNG (Mulberry32). */
export function createSeededRandom(initialSeed: number): () => number {
  let a = initialSeed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Caps animation loop to target FPS (default ~30fps). */
export function shouldSkipFrame(
  currentTime: number,
  lastFrameTime: number,
  targetFps = 30,
): boolean {
  if (lastFrameTime <= 0) return false
  return currentTime - lastFrameTime < 1000 / targetFps
}

/** Generates the next spawn interval in milliseconds (2.5s - 7.0s). */
export function getNextSpawnInterval(
  rand: () => number,
  minSec = 2.5,
  maxSec = 7.0,
): number {
  return (minSec + rand() * (maxSec - minSec)) * 1000
}

/** Checks if a new comet is allowed to spawn (at most maxAlive at once). */
export function canSpawnComet(aliveCount: number, maxAlive = 4): boolean {
  return aliveCount < maxAlive
}

/** Checks if elapsed time since last spawn meets or exceeds the interval. */
export function isSpawnDue(
  currentTime: number,
  lastSpawnTime: number,
  intervalMs: number,
): boolean {
  return currentTime - lastSpawnTime >= intervalMs
}

/** Picks comet color and type according to specification. */
export function pickCometColor(rand: () => number): CometColorConfig {
  const isGreat = rand() < (1 / 6)
  const roll = rand()
  let tailColorRgb: RgbTriple

  if (roll < 0.6) {
    tailColorRgb = rand() > 0.5 ? PALETTE.sand : PALETTE.bone
  } else if (roll < 0.85) {
    tailColorRgb = PALETTE.coral
  } else {
    tailColorRgb = PALETTE.blueLightened
  }

  return {
    type: isGreat ? 'great' : 'standard',
    headCoreRgba: 'rgba(234, 230, 222, 0.85)',
    headGlowRgba: 'rgba(239, 133, 87, 0.5)',
    tailColorRgb,
    ionTailColorRgb: isGreat ? PALETTE.blueLightened : undefined,
  }
}

/** Computes position along a quadratic Bézier curve at parameter t in [0, 1]. */
export function computeQuadraticPoint(
  p0: Point2D,
  pc: Point2D,
  p1: Point2D,
  t: number,
): Point2D {
  const clampedT = Math.max(0, Math.min(1, t))
  const mt = 1 - clampedT
  return {
    x: mt * mt * p0.x + 2 * mt * clampedT * pc.x + clampedT * clampedT * p1.x,
    y: mt * mt * p0.y + 2 * mt * clampedT * pc.y + clampedT * clampedT * p1.y,
  }
}

/** Computes tangent velocity vector at parameter t in [0, 1]. */
export function computeQuadraticTangent(
  p0: Point2D,
  pc: Point2D,
  p1: Point2D,
  t: number,
): Point2D {
  const clampedT = Math.max(0, Math.min(1, t))
  const mt = 1 - clampedT
  return {
    x: 2 * mt * (pc.x - p0.x) + 2 * clampedT * (p1.x - pc.x),
    y: 2 * mt * (pc.y - p0.y) + 2 * clampedT * (p1.y - pc.y),
  }
}

/** Generates diagonal trajectory crossing the viewport at varied speeds. */
export function createCometTrajectory(
  width: number,
  height: number,
  rand: () => number,
): TrajectoryConfig {
  const color = pickCometColor(rand)
  const isGreat = color.type === 'great'
  const duration = isGreat ? 6000 + rand() * 3000 : 2600 + rand() * 2600
  const entryEdge = rand() < 0.5 ? 0 : rand() < 0.75 ? 1 : 2
  const margin = 80
  let p0: Point2D
  let p1: Point2D

  if (entryEdge === 0) {
    p0 = { x: rand() * (width + margin * 2) - margin, y: -margin }
    const targetX = p0.x < width / 2
      ? width * 0.4 + rand() * (width * 0.7)
      : rand() * (width * 0.6) - margin
    p1 = { x: targetX, y: height + margin }
  } else if (entryEdge === 1) {
    p0 = { x: -margin, y: rand() * (height * 0.7) }
    p1 = { x: width + margin, y: height * 0.3 + rand() * (height * 0.8) }
  } else {
    p0 = { x: width + margin, y: rand() * (height * 0.7) }
    p1 = { x: -margin, y: height * 0.3 + rand() * (height * 0.8) }
  }

  const midX = (p0.x + p1.x) / 2
  const midY = (p0.y + p1.y) / 2
  const dx = p1.x - p0.x
  const dy = p1.y - p0.y
  const dist = Math.hypot(dx, dy) || 1
  const nx = -dy / dist
  const ny = dx / dist
  const curveMagnitude = (rand() - 0.5) * 0.16 * dist

  return {
    p0,
    pc: { x: midX + nx * curveMagnitude, y: midY + ny * curveMagnitude },
    p1,
    duration,
    color,
    headRadius: isGreat ? 3.5 : 2.0,
    tailWidth: isGreat ? 6.5 : 3.2,
  }
}

/** Samples positions along trajectory for tail rendering. */
export function sampleTrajectoryHistory(
  p0: Point2D,
  pc: Point2D,
  p1: Point2D,
  currentT: number,
  tailSpan: number,
  steps = 24,
): TailSample[] {
  const samples: TailSample[] = []
  const stepT = tailSpan / Math.max(1, steps)

  for (let i = 0; i <= steps; i++) {
    const t = currentT - i * stepT
    if (t < 0) break
    const pt = computeQuadraticPoint(p0, pc, p1, t)
    samples.push({ x: pt.x, y: pt.y, age: i / steps })
  }
  return samples
}

/** Generates sparse, faint static star dust layer (60 - 120 stars, max alpha <= 0.35). */
export function generateStarDust(
  count: number,
  width: number,
  height: number,
  seed = 4242,
): StarDustPoint[] {
  const rand = createSeededRandom(seed)
  const safeCount = Math.max(60, Math.min(120, count))
  const stars: StarDustPoint[] = []

  for (let i = 0; i < safeCount; i++) {
    const x = Math.round(rand() * width * 10) / 10
    const y = Math.round(rand() * height * 10) / 10
    const radius = Math.round((0.6 + rand() * 1.0) * 10) / 10
    const baseAlpha = Math.round((0.08 + rand() * 0.17) * 100) / 100
    const twinkleSpeed = Math.round((0.6 + rand() * 1.6) * 100) / 100
    const phase = Math.round(rand() * Math.PI * 2 * 100) / 100
    const roll = rand()
    const colorRgb = roll < 0.7 ? PALETTE.bone : roll < 0.9 ? PALETTE.sand : PALETTE.coral

    stars.push({ x, y, radius, baseAlpha, twinkleSpeed, phase, colorRgb })
  }
  return stars
}

/** Calculates twinkling alpha for a star, strictly capped at 0.35. */
export function getStarAlpha(
  baseAlpha: number,
  twinkleSpeed: number,
  phase: number,
  timeMs: number,
): number {
  const timeSec = timeMs / 1000
  const mult = 0.65 + 0.35 * Math.sin(timeSec * twinkleSpeed + phase)
  const alpha = baseAlpha * mult
  return Math.min(0.35, Math.max(0, Math.round(alpha * 1000) / 1000))
}

/** Creates 2 frozen comet streaks for the reduced motion / low-end static frame. */
export function createStaticCometStreaks(
  width: number,
  height: number,
): StaticCometStreak[] {
  return [
    {
      p0: { x: width * 0.1, y: height * 0.05 },
      pc: { x: width * 0.35, y: height * 0.22 },
      p1: { x: width * 0.75, y: height * 0.5 },
      t: 0.65,
      tailSpan: 0.25,
      color: {
        type: 'standard',
        headCoreRgba: 'rgba(234, 230, 222, 0.85)',
        headGlowRgba: 'rgba(239, 133, 87, 0.45)',
        tailColorRgb: PALETTE.sand,
      },
      headRadius: 2.2,
      tailWidth: 3.5,
    },
    {
      p0: { x: width * 0.88, y: height * 0.18 },
      pc: { x: width * 0.55, y: height * 0.42 },
      p1: { x: width * 0.15, y: height * 0.78 },
      t: 0.55,
      tailSpan: 0.28,
      color: {
        type: 'great',
        headCoreRgba: 'rgba(234, 230, 222, 0.85)',
        headGlowRgba: 'rgba(239, 133, 87, 0.5)',
        tailColorRgb: PALETTE.coral,
        ionTailColorRgb: PALETTE.blueLightened,
      },
      headRadius: 3.4,
      tailWidth: 6.0,
    },
  ]
}

/** Determines whether the client device is low-end or has Save-Data enabled. */
export function isLowEndDevice(nav?: Navigator): boolean {
  if (typeof window === 'undefined') return false
  const n = nav ?? (typeof navigator !== 'undefined' ? navigator : undefined)
  if (!n) return false

  if (n.hardwareConcurrency != null && n.hardwareConcurrency <= 2) {
    return true
  }

  const conn = (n as unknown as { connection?: { saveData?: boolean } }).connection
  return conn?.saveData === true
}
