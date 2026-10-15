import { describe, expect, it } from 'vitest'
import {
  createPrng,
  CONSTELLATIONS,
  computeConstellationPath,
  computeConstellationPathLength,
  generateBlinkingStars,
} from './heroSkyMath'

describe('createPrng (Mulberry32)', () => {
  it('generates deterministic pseudorandom numbers in [0, 1)', () => {
    const prng1 = createPrng(0x2026)
    const prng2 = createPrng(0x2026)

    const values1 = [prng1(), prng1(), prng1(), prng1()]
    const values2 = [prng2(), prng2(), prng2(), prng2()]

    expect(values1).toEqual(values2)
    for (const v of values1) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('produces different sequences for different seeds', () => {
    const prngA = createPrng(42)
    const prngB = createPrng(999)
    expect(prngA()).not.toBe(prngB())
  })
})

describe('CONSTELLATIONS data', () => {
  it('defines 5 iconic cosmic constellations', () => {
    expect(CONSTELLATIONS).toHaveLength(5)
    const names = CONSTELLATIONS.map((c) => c.name)
    expect(names).toContain('CASSIOPEIA')
    expect(names).toContain('CYGNUS')
    expect(names).toContain('URSA MAJOR')
    expect(names).toContain('ORION')
    expect(names).toContain('LYRA')
  })

  it('contains valid star coordinates and positive radii', () => {
    for (const c of CONSTELLATIONS) {
      expect(c.stars.length).toBeGreaterThanOrEqual(5)
      for (const s of c.stars) {
        expect(Number.isFinite(s.x)).toBe(true)
        expect(Number.isFinite(s.y)).toBe(true)
        expect(s.r).toBeGreaterThan(0)
        expect(s.x).toBeGreaterThanOrEqual(0)
        expect(s.x).toBeLessThanOrEqual(c.viewBox.width)
        expect(s.y).toBeGreaterThanOrEqual(0)
        expect(s.y).toBeLessThanOrEqual(c.viewBox.height)
      }
    }
  })

  it('has line indices that point to valid star indices', () => {
    for (const c of CONSTELLATIONS) {
      expect(c.lines.length).toBeGreaterThan(0)
      for (const [fromIdx, toIdx] of c.lines) {
        expect(fromIdx).toBeGreaterThanOrEqual(0)
        expect(fromIdx).toBeLessThan(c.stars.length)
        expect(toIdx).toBeGreaterThanOrEqual(0)
        expect(toIdx).toBeLessThan(c.stars.length)
        expect(fromIdx).not.toBe(toIdx)
      }
    }
  })

  it('limits to 2-3 constellations on mobile by flagging excess constellations', () => {
    const mobileVisible = CONSTELLATIONS.filter((c) => !c.mobilePlacement?.hideOnMobile)
    expect(mobileVisible.length).toBeGreaterThanOrEqual(2)
    expect(mobileVisible.length).toBeLessThanOrEqual(3)
  })
})

describe('computeConstellationPath and computeConstellationPathLength', () => {
  it('generates an SVG path string containing M and L instructions', () => {
    const cas = CONSTELLATIONS[0]
    const path = computeConstellationPath(cas)
    expect(path).toMatch(/M\s+[\d.-]+\s+[\d.-]+\s+L\s+[\d.-]+\s+[\d.-]+/)
  })

  it('computes positive, finite Euclidean line length', () => {
    for (const c of CONSTELLATIONS) {
      const len = computeConstellationPathLength(c)
      expect(len).toBeGreaterThan(50)
      expect(Number.isFinite(len)).toBe(true)
    }
  })
})

describe('generateBlinkingStars', () => {
  it('generates between 25 and 40 deterministic stars', () => {
    const stars1 = generateBlinkingStars(1234)
    const stars2 = generateBlinkingStars(1234)

    expect(stars1.length).toBeGreaterThanOrEqual(25)
    expect(stars1.length).toBeLessThanOrEqual(40)
    expect(stars1).toEqual(stars2)
  })

  it('contains exactly 4-6 hero stars with cross diffraction spikes', () => {
    const stars = generateBlinkingStars()
    const heroStars = stars.filter((s) => s.behavior === 'hero-star')
    expect(heroStars.length).toBeGreaterThanOrEqual(4)
    expect(heroStars.length).toBeLessThanOrEqual(6)

    for (const hs of heroStars) {
      expect(hs.glintSize).toBeDefined()
      expect(hs.glintSize).toBeGreaterThan(3)
    }
  })

  it('covers all 4 distinct star behaviors', () => {
    const stars = generateBlinkingStars()
    const behaviors = new Set(stars.map((s) => s.behavior))
    expect(behaviors.has('slow-twinkle')).toBe(true)
    expect(behaviors.has('double-blink')).toBe(true)
    expect(behaviors.has('color-shift')).toBe(true)
    expect(behaviors.has('hero-star')).toBe(true)
  })

  it('bounds all star coordinates within visible sky percentages', () => {
    const stars = generateBlinkingStars()
    for (const s of stars) {
      expect(s.x).toBeGreaterThanOrEqual(0)
      expect(s.x).toBeLessThanOrEqual(100)
      expect(s.y).toBeGreaterThanOrEqual(0)
      expect(s.y).toBeLessThanOrEqual(100)
      expect(s.duration).toBeGreaterThan(0)
      expect(s.delay).toBeGreaterThanOrEqual(0)
      expect(s.r).toBeGreaterThan(0)
    }
  })

  it('keeps stars away from the central text zone to prevent occlusion', () => {
    const stars = generateBlinkingStars()
    for (const s of stars) {
      const isDeadCenter = s.x > 36 && s.x < 64 && s.y > 22 && s.y < 62
      expect(isDeadCenter).toBe(false)
    }
  })
})

describe('HeroSky component DOM structure', () => {
  it('renders all 5 constellations, celestial bodies, and aria-hidden=true', async () => {
    const { act, createElement } = await import('react')
    const { createRoot } = await import('react-dom/client')
    const { default: HeroSky } = await import('./HeroSky')

    window.matchMedia =
      window.matchMedia ||
      (() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }))

    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(createElement(HeroSky))
    })

    const heroSkyEl = container.querySelector('.hero-sky')
    expect(heroSkyEl).not.toBeNull()
    expect(heroSkyEl?.getAttribute('aria-hidden')).toBe('true')

    // Constellations
    const constellations = container.querySelectorAll('.hero-sky__constellation')
    expect(constellations.length).toBe(5)

    const labels = Array.from(container.querySelectorAll('.hero-sky__constellation-label')).map(
      (el) => el.textContent,
    )
    expect(labels).toContain('CASSIOPEIA')
    expect(labels).toContain('CYGNUS')
    expect(labels).toContain('URSA MAJOR')
    expect(labels).toContain('ORION')
    expect(labels).toContain('LYRA')

    // Celestial bodies
    expect(container.querySelector('.hero-sky__gas-giant')).not.toBeNull()
    expect(container.querySelector('.hero-sky__crescent-moon')).not.toBeNull()
    expect(container.querySelector('.hero-sky__galaxy')).not.toBeNull()
    expect(container.querySelector('.hero-sky__aurora')).not.toBeNull()
    expect(container.querySelector('.hero-sky__satellite')).not.toBeNull()
    expect(container.querySelectorAll('.hero-sky__pulsar').length).toBe(2)

    // UserSpaceOnUse filter for glow (Rule 9)
    const filter = container.querySelector('#hero-sky-glow')
    expect(filter).not.toBeNull()
    expect(filter?.getAttribute('filterUnits')).toBe('userSpaceOnUse')

    await act(async () => {
      root.unmount()
    })
    document.body.removeChild(container)
  })
})

