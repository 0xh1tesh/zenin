/**
 * Pure data structures, astronomical coordinates, seeded generation,
 * and layout helpers for DeepSky.
 */

export interface StarData {
  id: string
  x: number // percentage 0 - 100
  y: number // percentage 0 - 100
  size: number // px
  behavior: 'twinkle-slow' | 'twinkle-fast' | 'double-blink' | 'color-shift' | 'glint'
  color: string
  delay: number // seconds
  duration: number // seconds
  isMobile: boolean
  hasGlint: boolean
}

export type CelestialBodyType =
  | 'ringed-planet'
  | 'cratered-moon'
  | 'ice-planet'
  | 'spiral-galaxy'
  | 'pulsar-a'
  | 'pulsar-b'
  | 'binary-star'
  | 'asteroid-a'
  | 'asteroid-b'

export interface CelestialBodyData {
  id: string
  type: CelestialBodyType
  name: string
  size: number
  opacity: number
  position: { top: string; left?: string; right?: string }
  mobilePosition?: { top: string; left?: string; right?: string }
  isMobile: boolean
}

// Re-export constellation structures & astronomical dataset
export {
  CONSTELLATIONS,
  type ConstellationData,
  type ConstellationStar,
  filterConstellationsForMobile,
} from './constellationsData'

/**
 * Fast deterministic PRNG (Mulberry32).
 * Produces identical floating-point sequences in [0, 1) for a given seed.
 */
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Deterministically generates background field stars with varied behaviors and colors.
 */
export function generateStars(count = 80, seed = 2026): StarData[] {
  const rand = mulberry32(seed)
  const stars: StarData[] = []

  const colors = ['var(--bone)', 'var(--sand)', 'var(--coral)', 'var(--blue)']

  for (let i = 0; i < count; i++) {
    const x = Math.round((2 + rand() * 96) * 10) / 10
    const y = Math.round((2 + rand() * 96) * 10) / 10

    const roll = rand()
    let behavior: StarData['behavior']
    let size: number
    let duration: number
    let hasGlint = false

    if (roll < 0.4) {
      behavior = 'twinkle-slow'
      size = Math.round((1.0 + rand() * 1.2) * 10) / 10
      duration = Math.round((3.2 + rand() * 2.8) * 10) / 10
    } else if (roll < 0.65) {
      behavior = 'twinkle-fast'
      size = Math.round((0.8 + rand() * 1.0) * 10) / 10
      duration = Math.round((1.8 + rand() * 1.2) * 10) / 10
    } else if (roll < 0.8) {
      behavior = 'double-blink'
      size = Math.round((1.2 + rand() * 1.2) * 10) / 10
      duration = Math.round((4.0 + rand() * 2.5) * 10) / 10
    } else if (roll < 0.92) {
      behavior = 'color-shift'
      size = Math.round((1.4 + rand() * 1.2) * 10) / 10
      duration = Math.round((5.0 + rand() * 3.0) * 10) / 10
    } else {
      behavior = 'glint'
      size = Math.round((2.2 + rand() * 0.8) * 10) / 10
      duration = Math.round((6.0 + rand() * 3.0) * 10) / 10
      hasGlint = true
    }

    const colorIdx = Math.floor(rand() * colors.length)
    const color = colors[colorIdx]
    const delay = Math.round(rand() * 5 * 10) / 10
    // Keep roughly half the stars on mobile (<640px)
    const isMobile = i % 2 === 0

    stars.push({
      id: `star-${i}`,
      x,
      y,
      size,
      behavior,
      color,
      delay,
      duration,
      isMobile,
      hasGlint,
    })
  }

  return stars
}

export function filterStarsForMobile(stars: StarData[]): StarData[] {
  return stars.filter((s) => s.isMobile)
}

/**
 * 9 distinct celestial bodies placed subtly along sky flanks.
 * Kept small (20px to 110px) with low opacity (0.35 to 0.55).
 */
export const CELESTIAL_BODIES: CelestialBodyData[] = [
  {
    id: 'ringed-planet',
    type: 'ringed-planet',
    name: 'Ringed Planet',
    size: 88,
    opacity: 0.5,
    position: { top: '14%', left: '3%' },
    mobilePosition: { top: '22%', left: '2%' },
    isMobile: true,
  },
  {
    id: 'cratered-moon',
    type: 'cratered-moon',
    name: 'Cratered Moon',
    size: 58,
    opacity: 0.48,
    position: { top: '56%', right: '4%' },
    mobilePosition: { top: '58%', right: '2%' },
    isMobile: true,
  },
  {
    id: 'ice-planet',
    type: 'ice-planet',
    name: 'Ice Planet',
    size: 50,
    opacity: 0.45,
    position: { top: '81%', left: '4%' },
    mobilePosition: { top: '88%', left: '3%' },
    isMobile: true,
  },
  {
    id: 'spiral-galaxy',
    type: 'spiral-galaxy',
    name: 'Spiral Galaxy',
    size: 110,
    opacity: 0.42,
    position: { top: '27%', right: '2%' },
    isMobile: false,
  },
  {
    id: 'pulsar-a',
    type: 'pulsar-a',
    name: 'Pulsar Alpha',
    size: 52,
    opacity: 0.5,
    position: { top: '39%', left: '2%' },
    isMobile: false,
  },
  {
    id: 'pulsar-b',
    type: 'pulsar-b',
    name: 'Pulsar Beta',
    size: 48,
    opacity: 0.45,
    position: { top: '71%', right: '3%' },
    isMobile: false,
  },
  {
    id: 'binary-star',
    type: 'binary-star',
    name: 'Binary Star Pair',
    size: 44,
    opacity: 0.55,
    position: { top: '5%', left: '6%' },
    isMobile: false,
  },
  {
    id: 'asteroid-a',
    type: 'asteroid-a',
    name: 'Asteroid Ceres',
    size: 26,
    opacity: 0.4,
    position: { top: '47%', right: '6%' },
    isMobile: false,
  },
  {
    id: 'asteroid-b',
    type: 'asteroid-b',
    name: 'Asteroid Vesta',
    size: 20,
    opacity: 0.36,
    position: { top: '89%', right: '7%' },
    isMobile: false,
  },
]

export function filterBodiesForMobile(bodies: CelestialBodyData[]): CelestialBodyData[] {
  return bodies.filter((b) => b.isMobile)
}

/**
 * Computes deep sky parallax vertical translation offset in pixels.
 * Uses subtle drift factor (~0.05x).
 */
export function computeParallaxOffset(scrollY: number, maxDrift = 200): number {
  if (scrollY <= 0) return 0
  const drift = -scrollY * 0.05
  return Math.max(-maxDrift, Math.round(drift * 10) / 10)
}
