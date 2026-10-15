import { useEffect } from 'react'
import { prefersReducedMotion } from '../../lib/motion'
import { distanceToRect, repelOffset, type Offset } from './cursorSkyMath'
import './cursor-sky.css'

const CONSTELLATIONS = '.hero-sky__constellation, .deepsky-constellation'
const BODIES =
  '.hero-sky__gas-giant, .hero-sky__crescent-moon, .hero-sky__galaxy, .hero-sky__pulsar, .deepsky-body:not([class*="asteroid"])'
const STARS = '.hero-sky__star, .deepsky-star'

const CONSTELLATION_REACH = 70
const BODY_REACH = 110
const STAR_REACH = 130
const STAR_PUSH = 16
const NEAR = 'is-cursor-near'
const OFFSCREEN = -10_000

/**
 * The sky answers the cursor: constellations draw themselves in and light up, stars drift aside, and planets,
 * moons and galaxies swell and show their names. Every sky layer ignores the pointer (so clicks reach the page),
 * so this works by proximity: one rAF-throttled pass per pointer move reads all positions, then writes classes.
 * Only on devices with a real hover pointer; star drift is skipped for reduced motion or paused animations.
 */
export function useCursorSky(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined

    let frame = 0
    let pointerX = OFFSCREEN
    let pointerY = OFFSCREEN
    const drifted = new Map<HTMLElement, Offset>()

    const update = () => {
      frame = 0
      const viewportHeight = window.innerHeight
      const writes: Array<() => void> = []

      for (const el of document.querySelectorAll<HTMLElement>(`${CONSTELLATIONS}, ${BODIES}`)) {
        const rect = el.getBoundingClientRect()
        const visible = rect.width > 0 && rect.bottom > 0 && rect.top < viewportHeight
        const reach = el.matches(BODIES) ? BODY_REACH : CONSTELLATION_REACH
        const near = visible && distanceToRect(pointerX, pointerY, rect) <= reach
        if (near !== el.classList.contains(NEAR)) writes.push(() => el.classList.toggle(NEAR, near))
      }

      if (!prefersReducedMotion()) {
        for (const el of document.querySelectorAll<HTMLElement>(STARS)) {
          const rect = el.getBoundingClientRect()
          if (rect.width === 0) continue
          // Measure from the star's resting place, not where the last drift left it.
          const applied = drifted.get(el)
          const restX = rect.left + rect.width / 2 - (applied?.x ?? 0)
          const restY = rect.top + rect.height / 2 - (applied?.y ?? 0)
          const offset = repelOffset(pointerX, pointerY, restX, restY, STAR_REACH, STAR_PUSH)
          if (offset) {
            drifted.set(el, offset)
            writes.push(() => {
              el.style.translate = `${offset.x.toFixed(1)}px ${offset.y.toFixed(1)}px`
              el.classList.add(NEAR)
            })
          } else if (applied) {
            drifted.delete(el)
            writes.push(() => {
              el.style.translate = ''
              el.classList.remove(NEAR)
            })
          }
        }
      }

      for (const write of writes) write()
    }

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update)
    }
    const onMove = (event: PointerEvent) => {
      pointerX = event.clientX
      pointerY = event.clientY
      schedule()
    }
    const onLeave = (event: MouseEvent) => {
      if (event.relatedTarget) return
      pointerX = OFFSCREEN
      pointerY = OFFSCREEN
      schedule()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', schedule, { passive: true })
    document.addEventListener('mouseout', onLeave)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', schedule)
      document.removeEventListener('mouseout', onLeave)
      if (frame) cancelAnimationFrame(frame)
      for (const el of drifted.keys()) el.style.translate = ''
      for (const el of document.querySelectorAll(`.${NEAR}`)) el.classList.remove(NEAR)
    }
  }, [enabled])
}
