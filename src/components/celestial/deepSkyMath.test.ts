import { describe, expect, it } from 'vitest'
import {
  CELESTIAL_BODIES,
  CONSTELLATIONS,
  computeParallaxOffset,
  filterBodiesForMobile,
  filterConstellationsForMobile,
  filterStarsForMobile,
  generateStars,
  mulberry32,
} from './deepSkyMath'

describe('deepSky logic and data helpers', () => {
  describe('mulberry32 PRNG', () => {
    it('produces identical pseudo-random numbers for identical seeds', () => {
      const rand1 = mulberry32(12345)
      const rand2 = mulberry32(12345)
      const seq1 = [rand1(), rand1(), rand1(), rand1()]
      const seq2 = [rand2(), rand2(), rand2(), rand2()]
      expect(seq1).toEqual(seq2)
    })

    it('produces different sequences for different seeds', () => {
      const rand1 = mulberry32(100)
      const rand2 = mulberry32(200)
      expect(rand1()).not.toEqual(rand2())
    })

    it('produces floats in [0, 1) range', () => {
      const rand = mulberry32(999)
      for (let i = 0; i < 50; i++) {
        const val = rand()
        expect(val).toBeGreaterThanOrEqual(0)
        expect(val).toBeLessThan(1)
      }
    })
  })

  describe('generateStars', () => {
    it('generates the specified number of stars with default seed', () => {
      const stars = generateStars(80, 2026)
      expect(stars).toHaveLength(80)
    })

    it('produces identical star layout when run multiple times with same seed', () => {
      const starsA = generateStars(60, 42)
      const starsB = generateStars(60, 42)
      expect(starsA).toEqual(starsB)
    })

    it('keeps star coordinates within bounds [2, 98]%', () => {
      const stars = generateStars(100, 777)
      for (const s of stars) {
        expect(s.x).toBeGreaterThanOrEqual(2)
        expect(s.x).toBeLessThanOrEqual(98)
        expect(s.y).toBeGreaterThanOrEqual(2)
        expect(s.y).toBeLessThanOrEqual(98)
      }
    })

    it('generates valid sizes and delays', () => {
      const stars = generateStars(50, 888)
      for (const s of stars) {
        expect(s.size).toBeGreaterThan(0.5)
        expect(s.size).toBeLessThanOrEqual(3.5)
        expect(s.delay).toBeGreaterThanOrEqual(0)
        expect(s.duration).toBeGreaterThan(1.0)
      }
    })

    it('distributes all 5 star behaviors including glint', () => {
      const stars = generateStars(100, 123)
      const behaviors = new Set(stars.map((s) => s.behavior))
      expect(behaviors.has('twinkle-slow')).toBe(true)
      expect(behaviors.has('twinkle-fast')).toBe(true)
      expect(behaviors.has('double-blink')).toBe(true)
      expect(behaviors.has('color-shift')).toBe(true)
      expect(behaviors.has('glint')).toBe(true)
    })

    it('filters stars for mobile to roughly half', () => {
      const stars = generateStars(80, 2026)
      const mobileStars = filterStarsForMobile(stars)
      expect(mobileStars.length).toBe(40)
      for (const s of mobileStars) {
        expect(s.isMobile).toBe(true)
      }
    })
  })

  describe('CONSTELLATIONS data', () => {
    it('contains exactly 8 constellations', () => {
      expect(CONSTELLATIONS).toHaveLength(8)
    })

    it('each constellation has valid non-empty fields', () => {
      for (const c of CONSTELLATIONS) {
        expect(c.id).toBeTruthy()
        expect(c.name).toBeTruthy()
        expect(c.label).toBeTruthy()
        expect(c.viewBox).toBeTruthy()
        expect(c.pathD).toBeTruthy()
        expect(c.lineLength).toBeGreaterThan(100)
        expect(c.stars.length).toBeGreaterThanOrEqual(5)
        expect(c.position.top).toBeTruthy()
        expect(c.position.left || c.position.right).toBeTruthy()
      }
    })

    it('has unique IDs and indexes', () => {
      const ids = new Set(CONSTELLATIONS.map((c) => c.id))
      expect(ids.size).toBe(CONSTELLATIONS.length)
      const indices = CONSTELLATIONS.map((c) => c.desktopIndex)
      expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    })

    it('filters exactly 3 constellations for mobile', () => {
      const mobileConstellations = filterConstellationsForMobile(CONSTELLATIONS)
      expect(mobileConstellations).toHaveLength(3)
      const names = mobileConstellations.map((c) => c.name)
      expect(names).toContain('Orion')
      expect(names).toContain('Cassiopeia')
      expect(names).toContain('Cygnus')
    })
  })

  describe('CELESTIAL_BODIES data', () => {
    it('contains 9 celestial bodies including required types', () => {
      expect(CELESTIAL_BODIES).toHaveLength(9)
      const types = new Set(CELESTIAL_BODIES.map((b) => b.type))
      expect(types.has('ringed-planet')).toBe(true)
      expect(types.has('cratered-moon')).toBe(true)
      expect(types.has('ice-planet')).toBe(true)
      expect(types.has('spiral-galaxy')).toBe(true)
      expect(types.has('pulsar-a')).toBe(true)
      expect(types.has('pulsar-b')).toBe(true)
      expect(types.has('binary-star')).toBe(true)
      expect(types.has('asteroid-a')).toBe(true)
      expect(types.has('asteroid-b')).toBe(true)
    })

    it('keeps body sizes between 20px and 120px and opacities <= 0.6', () => {
      for (const b of CELESTIAL_BODIES) {
        expect(b.size).toBeGreaterThanOrEqual(20)
        expect(b.size).toBeLessThanOrEqual(120)
        expect(b.opacity).toBeGreaterThanOrEqual(0.3)
        expect(b.opacity).toBeLessThanOrEqual(0.6)
      }
    })

    it('filters exactly 3 bodies for mobile', () => {
      const mobileBodies = filterBodiesForMobile(CELESTIAL_BODIES)
      expect(mobileBodies).toHaveLength(3)
      const types = mobileBodies.map((b) => b.type)
      expect(types).toContain('ringed-planet')
      expect(types).toContain('cratered-moon')
      expect(types).toContain('ice-planet')
    })
  })

  describe('computeParallaxOffset', () => {
    it('returns 0 for zero or negative scroll', () => {
      expect(computeParallaxOffset(0)).toBe(0)
      expect(computeParallaxOffset(-100)).toBe(0)
    })

    it('calculates negative drift at ~0.05x speed', () => {
      expect(computeParallaxOffset(1000)).toBe(-50)
      expect(computeParallaxOffset(2000)).toBe(-100)
    })

    it('clamps to maxDrift', () => {
      expect(computeParallaxOffset(10000, 150)).toBe(-150)
    })
  })

  describe('DeepSky component tree rendering', () => {
    it('verifies exports and module types', async () => {
      const DeepSkyMod = await import('./DeepSky.tsx')
      const StarsMod = await import('./DeepSkyStars.tsx')
      const ConstMod = await import('./DeepSkyConstellations.tsx')
      const BodiesMod = await import('./DeepSkyBodies.tsx')

      expect(typeof DeepSkyMod.default).toBe('function')
      expect(typeof StarsMod.DeepSkyStars).toBe('object')
      expect(typeof ConstMod.DeepSkyConstellations).toBe('object')
      expect(typeof BodiesMod.DeepSkyBodies).toBe('object')
    })
  })
})
