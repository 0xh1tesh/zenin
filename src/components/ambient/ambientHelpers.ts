/**
 * Deterministic helper functions for ambient motion and time-sensitive triggers.
 * Keeps renders pure and reproducible without client/server hydration issues or test jitter.
 */

export interface SparkleItem {
  id: number
  x: number // percentage 0 - 100
  y: number // percentage 0 - 100
  size: number // px (typically 2 - 6)
  delay: number // seconds
  duration: number // seconds
  opacity: number // 0.3 - 0.95
  isGlint: boolean // whether to render a 4-point star glint instead of a dot
}

/**
 * Creates a deterministic 32-bit PRNG (Mulberry32).
 * Returns floating point values in [0, 1).
 */
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

/**
 * Generates an array of sparkle positions and animation parameters deterministically.
 */
export function generateSparkles(count: number, seed = 42): SparkleItem[] {
  const rand = createSeededRandom(seed)
  const items: SparkleItem[] = []

  for (let i = 0; i < count; i++) {
    // Keep stars inside 3% to 97% to avoid clipping at boundaries
    const x = Math.round((3 + rand() * 94) * 10) / 10
    const y = Math.round((3 + rand() * 94) * 10) / 10
    const size = Math.round((2 + rand() * 4) * 10) / 10
    const delay = Math.round(rand() * 5 * 100) / 100
    const duration = Math.round((2.2 + rand() * 3.5) * 100) / 100
    const opacity = Math.round((0.35 + rand() * 0.6) * 100) / 100
    const isGlint = rand() > 0.65

    items.push({
      id: i,
      x,
      y,
      size,
      delay,
      duration,
      opacity,
      isGlint,
    })
  }

  return items
}

/**
 * Checks whether an ISO date string deadline is within the given number of hours in the future.
 * Returns false if the deadline is invalid, already in the past, or further than `hours` away.
 */
export function isWithinHours(
  isoDateStr: string | null | undefined,
  hours = 72,
  now = Date.now(),
): boolean {
  if (!isoDateStr) return false
  const target = new Date(isoDateStr).getTime()
  if (Number.isNaN(target)) return false

  const diffMs = target - now
  const limitMs = hours * 3_600_000

  return diffMs > 0 && diffMs <= limitMs
}
