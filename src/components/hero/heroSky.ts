/**
 * heroSky.ts — Pure celestial and constellation geometry helpers for Zenin '26.
 * All positions are deterministic (Mulberry32 PRNG with fixed seed) to prevent
 * render-time Math.random() execution and keep first paint instantaneous.
 */

export interface BlinkingStar {
  id: string
  x: number // percentage 0..100
  y: number // percentage 0..100
  r: number // radius in px
  behavior: 'slow-twinkle' | 'double-blink' | 'color-shift' | 'hero-star'
  duration: number // seconds
  delay: number // seconds
  glintSize?: number // for hero stars with diffraction spikes
  layer: 'deep' | 'mid' | 'near'
}

export interface ConstellationStar {
  id: string
  x: number
  y: number
  r: number
  isAlpha?: boolean
}

export interface ConstellationSpec {
  id: string
  name: string
  viewBox: { width: number; height: number }
  stars: ConstellationStar[]
  lines: [number, number][]
  labelPos: { x: number; y: number }
  desktopPlacement: {
    top: string
    left?: string
    right?: string
    width: string
    height: string
  }
  mobilePlacement?: {
    top: string
    left?: string
    right?: string
    width: string
    height: string
    hideOnMobile?: boolean
  }
}

/**
 * Fast 32-bit Mulberry32 pseudo-random generator with fixed seed.
 * Produces deterministic uniform numbers in [0, 1).
 */
export function createPrng(seed: number) {
  let s = seed >>> 0
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 5 iconic, real constellations framed in the cosmic sky:
 * Cassiopeia, Cygnus, Ursa Major (Big Dipper), Orion, and Lyra.
 * Placed in upper-left, upper-right, and flanks to frame the central title and planet.
 */
export const CONSTELLATIONS: ConstellationSpec[] = [
  {
    id: 'cassiopeia',
    name: 'CASSIOPEIA',
    viewBox: { width: 200, height: 120 },
    stars: [
      { id: 'cas-0', x: 22, y: 32, r: 1.8 }, // Segin
      { id: 'cas-1', x: 62, y: 82, r: 2.1 }, // Ruchbah
      { id: 'cas-2', x: 102, y: 36, r: 2.6, isAlpha: true }, // Gamma Cas (Navi)
      { id: 'cas-3', x: 146, y: 86, r: 2.5, isAlpha: true }, // Schedar
      { id: 'cas-4', x: 184, y: 44, r: 2.2 }, // Caph
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    labelPos: { x: 104, y: 112 },
    desktopPlacement: {
      top: '7%',
      left: '4%',
      width: '185px',
      height: '115px',
    },
    mobilePlacement: {
      top: '5%',
      left: '3%',
      width: '135px',
      height: '84px',
    },
  },
  {
    id: 'cygnus',
    name: 'CYGNUS',
    viewBox: { width: 180, height: 200 },
    stars: [
      { id: 'cyg-0', x: 90, y: 22, r: 3.0, isAlpha: true }, // Deneb (supergiant)
      { id: 'cyg-1', x: 90, y: 86, r: 2.4 }, // Sadr
      { id: 'cyg-2', x: 90, y: 174, r: 2.1 }, // Albireo
      { id: 'cyg-3', x: 26, y: 96, r: 2.2 }, // Delta Cygni
      { id: 'cyg-4', x: 154, y: 76, r: 2.3 }, // Gienah
    ],
    lines: [
      [0, 1],
      [1, 2],
      [3, 1],
      [1, 4],
    ],
    labelPos: { x: 90, y: 196 },
    desktopPlacement: {
      top: '6%',
      right: '6%',
      width: '175px',
      height: '195px',
    },
    mobilePlacement: {
      top: '5%',
      right: '4%',
      width: '130px',
      height: '145px',
    },
  },
  {
    id: 'ursa-major',
    name: 'URSA MAJOR',
    viewBox: { width: 210, height: 135 },
    stars: [
      { id: 'uma-0', x: 182, y: 38, r: 2.6, isAlpha: true }, // Dubhe
      { id: 'uma-1', x: 176, y: 94, r: 2.4 }, // Merak
      { id: 'uma-2', x: 120, y: 98, r: 2.2 }, // Phecda
      { id: 'uma-3', x: 114, y: 46, r: 2.0 }, // Megrez
      { id: 'uma-4', x: 76, y: 56, r: 2.5 }, // Alioth
      { id: 'uma-5', x: 44, y: 78, r: 2.3 }, // Mizar
      { id: 'uma-6', x: 16, y: 112, r: 2.4 }, // Alkaid
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
    labelPos: { x: 118, y: 128 },
    desktopPlacement: {
      top: '23%',
      left: '3%',
      width: '205px',
      height: '132px',
    },
    mobilePlacement: {
      top: '19%',
      left: '2%',
      width: '150px',
      height: '96px',
    },
  },
  {
    id: 'orion',
    name: 'ORION',
    viewBox: { width: 190, height: 215 },
    stars: [
      { id: 'ori-0', x: 54, y: 36, r: 3.2, isAlpha: true }, // Betelgeuse (supergiant)
      { id: 'ori-1', x: 136, y: 44, r: 2.4 }, // Bellatrix
      { id: 'ori-2', x: 72, y: 108, r: 2.2 }, // Alnitak
      { id: 'ori-3', x: 90, y: 105, r: 2.3 }, // Alnilam
      { id: 'ori-4', x: 108, y: 102, r: 2.2 }, // Mintaka
      { id: 'ori-5', x: 58, y: 178, r: 2.4 }, // Saiph
      { id: 'ori-6', x: 142, y: 168, r: 3.1, isAlpha: true }, // Rigel
      { id: 'ori-7', x: 96, y: 16, r: 1.8 }, // Meissa
    ],
    lines: [
      [0, 1],
      [0, 2],
      [1, 4],
      [2, 3],
      [3, 4],
      [2, 5],
      [4, 6],
      [5, 6],
      [0, 7],
      [1, 7],
    ],
    labelPos: { x: 95, y: 204 },
    desktopPlacement: {
      top: '24%',
      right: '3%',
      width: '185px',
      height: '210px',
    },
    mobilePlacement: {
      top: '28%',
      right: '2%',
      width: '140px',
      height: '158px',
      hideOnMobile: true, // limit to 2-3 constellations on mobile
    },
  },
  {
    id: 'lyra',
    name: 'LYRA',
    viewBox: { width: 130, height: 165 },
    stars: [
      { id: 'lyr-0', x: 65, y: 22, r: 3.4, isAlpha: true }, // Vega (5th brightest)
      { id: 'lyr-1', x: 90, y: 46, r: 1.8 }, // Epsilon Lyr
      { id: 'lyr-2', x: 75, y: 82, r: 2.0 }, // Zeta Lyr
      { id: 'lyr-3', x: 48, y: 86, r: 1.9 }, // Delta Lyr
      { id: 'lyr-4', x: 84, y: 136, r: 2.3 }, // Sulafat
      { id: 'lyr-5', x: 44, y: 140, r: 2.2 }, // Sheliak
    ],
    lines: [
      [0, 1],
      [1, 2],
      [0, 3],
      [3, 2],
      [2, 4],
      [4, 5],
      [5, 3],
    ],
    labelPos: { x: 65, y: 160 },
    desktopPlacement: {
      top: '9%',
      left: '21%',
      width: '125px',
      height: '158px',
    },
    mobilePlacement: {
      top: '12%',
      left: '18%',
      width: '100px',
      height: '126px',
      hideOnMobile: true, // limit to 2-3 constellations on mobile
    },
  },
]

/**
 * Builds an SVG path string from constellation line segments.
 */
export function computeConstellationPath(c: ConstellationSpec): string {
  const parts: string[] = []
  for (const [fromIdx, toIdx] of c.lines) {
    const s1 = c.stars[fromIdx]
    const s2 = c.stars[toIdx]
    if (s1 && s2) {
      parts.push(`M ${s1.x.toFixed(1)} ${s1.y.toFixed(1)} L ${s2.x.toFixed(1)} ${s2.y.toFixed(1)}`)
    }
  }
  return parts.join(' ')
}

/**
 * Computes the total Euclidean stroke length of all lines in a constellation.
 */
export function computeConstellationPathLength(c: ConstellationSpec): number {
  let total = 0
  for (const [fromIdx, toIdx] of c.lines) {
    const s1 = c.stars[fromIdx]
    const s2 = c.stars[toIdx]
    if (s1 && s2) {
      const dx = s2.x - s1.x
      const dy = s2.y - s1.y
      total += Math.hypot(dx, dy)
    }
  }
  return Math.round(total)
}

/**
 * Generates deterministic blinking stars with 4 distinct behaviors:
 * 1) slow twinkle: gentle sinusoidal breathe
 * 2) quick double-blink: rapid cosmic scintillation
 * 3) color shift: chromatic shift (bone -> coral -> blue -> bone)
 * 4) hero stars: bright stars with 4-point cross diffraction spikes
 * Keeps the central text column clean to preserve readability of the H1/tagline/CTAs.
 */
export function generateBlinkingStars(seed = 0x2026): BlinkingStar[] {
  const rand = createPrng(seed)
  const stars: BlinkingStar[] = []
  const count = 34
  const heroIndices = new Set([2, 9, 17, 24, 30]) // 5 hero stars

  for (let i = 0; i < count; i++) {
    // Generate position avoiding the central text block (36%..64% X and 20%..65% Y)
    let x = 0
    let y = 0
    let attempts = 0
    while (attempts < 20) {
      attempts++
      const rawX = 3 + rand() * 94
      const rawY = 4 + rand() * 88
      const inCenterCol = rawX > 35 && rawX < 65
      const inCenterText = inCenterCol && rawY > 20 && rawY < 65
      if (!inCenterText) {
        x = Number(rawX.toFixed(2))
        y = Number(rawY.toFixed(2))
        break
      }
    }

    const isHero = heroIndices.has(i)
    let behavior: BlinkingStar['behavior']
    if (isHero) {
      behavior = 'hero-star'
    } else {
      const rVal = rand()
      if (rVal < 0.4) {
        behavior = 'slow-twinkle'
      } else if (rVal < 0.72) {
        behavior = 'double-blink'
      } else {
        behavior = 'color-shift'
      }
    }

    const duration = isHero
      ? Number((3.6 + rand() * 2.2).toFixed(2))
      : behavior === 'double-blink'
        ? Number((3.2 + rand() * 2.4).toFixed(2))
        : Number((4.0 + rand() * 3.5).toFixed(2))

    const delay = Number((rand() * 4.5).toFixed(2))
    const r = isHero
      ? Number((2.0 + rand() * 0.8).toFixed(2))
      : Number((0.8 + rand() * 1.1).toFixed(2))

    const glintSize = isHero ? Number((5.5 + rand() * 3.0).toFixed(1)) : undefined
    const layer = isHero ? 'near' : rand() > 0.5 ? 'mid' : 'deep'

    stars.push({
      id: `hero-sky-star-${i}`,
      x,
      y,
      r,
      behavior,
      duration,
      delay,
      glintSize,
      layer,
    })
  }

  return stars
}
