import { loadGsap, prefersReducedMotion } from './motion'

const DESKTOP_QUERY = '(min-width: 1024px) and (pointer: fine)'

/**
 * Lenis inertial scrolling, desktop with a mouse only, driven by GSAP's ticker so
 * ScrollTrigger stays in sync. Returns a cleanup function. Never throws.
 */
export async function startSmoothScroll(): Promise<() => void> {
  if (typeof window === 'undefined' || prefersReducedMotion() || !window.matchMedia(DESKTOP_QUERY).matches) {
    return () => undefined
  }
  try {
    const [{ gsap, ScrollTrigger }, { default: Lenis }] = await Promise.all([loadGsap(), import('lenis')])
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    const onTick = (time: number) => lenis.raf(time * 1000)
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(onTick)
      lenis.destroy()
    }
  } catch {
    return () => undefined
  }
}
