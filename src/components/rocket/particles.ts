export const MAX_PARTICLES_DESKTOP = 16
export const MAX_PARTICLES_MOBILE = 6

export interface ParticleState {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  active: boolean
}

/**
 * Pre-allocates a fixed pool of particles for zero GC during animations.
 */
export function createParticlePool(size = MAX_PARTICLES_DESKTOP): ParticleState[] {
  return Array.from({ length: size }, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 18,
    active: false,
  }))
}

/**
 * Emits a single particle from the rocket tail nozzle.
 */
export function emitParticle(
  pool: ParticleState[],
  maxCount: number,
  x: number,
  y: number,
  angleDeg: number,
  isScrollingUp: boolean,
  isMobile: boolean
): void {
  const inactive = pool.find((p, idx) => !p.active && idx < maxCount)
  if (!inactive) return

  inactive.active = true
  const rad = (angleDeg * Math.PI) / 180
  const tailOffset = isMobile ? 14 : 20
  inactive.x = x + Math.sin(rad) * tailOffset + (Math.random() - 0.5) * 4
  inactive.y = y - Math.cos(rad) * tailOffset + (Math.random() - 0.5) * 4
  inactive.vx = (Math.random() - 0.5) * 0.8
  inactive.vy = isScrollingUp ? 1.0 + Math.random() : -1.0 - Math.random()
  inactive.life = 18
  inactive.maxLife = 18
}

/**
 * Updates position, opacity, and transform of active particles.
 * Returns the count of remaining active particles.
 */
export function updateParticles(
  pool: ParticleState[],
  elements: (HTMLSpanElement | null)[],
  maxCount: number
): number {
  let activeCount = 0
  for (let i = 0; i < maxCount; i++) {
    const p = pool[i]
    const el = elements[i]
    if (!p || !el) continue

    if (p.active) {
      p.x += p.vx
      p.y += p.vy
      p.life -= 1
      activeCount++

      if (p.life <= 0) {
        p.active = false
        el.style.opacity = '0'
      } else {
        const ratio = p.life / p.maxLife
        el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) scale(${ratio.toFixed(2)})`
        el.style.opacity = (ratio * 0.8).toFixed(2)
      }
    } else {
      el.style.opacity = '0'
    }
  }
  return activeCount
}
