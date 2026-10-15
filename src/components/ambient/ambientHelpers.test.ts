import { describe, expect, it } from 'vitest'
import {
  createSeededRandom,
  generateSparkles,
  isWithinHours,
} from './ambientHelpers'

describe('createSeededRandom', () => {
  it('returns values consistently for the same seed', () => {
    const rand1 = createSeededRandom(123)
    const rand2 = createSeededRandom(123)

    const values1 = [rand1(), rand1(), rand1(), rand1()]
    const values2 = [rand2(), rand2(), rand2(), rand2()]

    expect(values1).toEqual(values2)
  })

  it('produces different sequences for different seeds', () => {
    const rand1 = createSeededRandom(123)
    const rand2 = createSeededRandom(456)

    expect(rand1()).not.toEqual(rand2())
  })

  it('produces values in the [0, 1) range', () => {
    const rand = createSeededRandom(999)
    for (let i = 0; i < 50; i++) {
      const val = rand()
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThan(1)
    }
  })
})

describe('generateSparkles', () => {
  it('generates the specified count of sparkles', () => {
    const sparkles = generateSparkles(15, 42)
    expect(sparkles).toHaveLength(15)
  })

  it('is completely deterministic for identical seeds', () => {
    const run1 = generateSparkles(20, 101)
    const run2 = generateSparkles(20, 101)
    expect(run1).toEqual(run2)
  })

  it('produces valid coordinates and parameters', () => {
    const sparkles = generateSparkles(25, 77)
    for (const item of sparkles) {
      expect(item.x).toBeGreaterThanOrEqual(0)
      expect(item.x).toBeLessThanOrEqual(100)
      expect(item.y).toBeGreaterThanOrEqual(0)
      expect(item.y).toBeLessThanOrEqual(100)
      expect(item.size).toBeGreaterThan(0)
      expect(item.duration).toBeGreaterThan(0)
      expect(item.delay).toBeGreaterThanOrEqual(0)
      expect(typeof item.isGlint).toBe('boolean')
    }
  })
})

describe('isWithinHours', () => {
  const BASE_NOW = new Date('2026-10-01T12:00:00Z').getTime()

  it('returns false for null or undefined', () => {
    expect(isWithinHours(null, 72, BASE_NOW)).toBe(false)
    expect(isWithinHours(undefined, 72, BASE_NOW)).toBe(false)
    expect(isWithinHours('', 72, BASE_NOW)).toBe(false)
  })

  it('returns false for past deadlines', () => {
    const past = new Date('2026-10-01T11:59:59Z').toISOString()
    expect(isWithinHours(past, 72, BASE_NOW)).toBe(false)
  })

  it('returns true for deadlines within 72 hours', () => {
    // 2 hours in the future
    const near = new Date(BASE_NOW + 2 * 3600 * 1000).toISOString()
    expect(isWithinHours(near, 72, BASE_NOW)).toBe(true)

    // 71.9 hours in the future
    const edge = new Date(BASE_NOW + 71.9 * 3600 * 1000).toISOString()
    expect(isWithinHours(edge, 72, BASE_NOW)).toBe(true)
  })

  it('returns false for deadlines beyond 72 hours', () => {
    // 73 hours in the future
    const far = new Date(BASE_NOW + 73 * 3600 * 1000).toISOString()
    expect(isWithinHours(far, 72, BASE_NOW)).toBe(false)

    // 10 days in the future
    const veryFar = new Date(BASE_NOW + 240 * 3600 * 1000).toISOString()
    expect(isWithinHours(veryFar, 72, BASE_NOW)).toBe(false)
  })
})
