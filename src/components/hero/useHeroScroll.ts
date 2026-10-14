import { useEffect, type RefObject } from 'react'
import { afterFirstInteraction, loadGsap, useReducedMotion } from '../../lib/motion'
import { ORBITS, orbitPoint } from './Orbits'

const DIVE_ORIGIN = '50% 100%'

/**
 * Scroll-scrubbed "camera dive" through the layered scene. Loads GSAP after first paint,
 * animates only transform/opacity on the layers (plus two tiny SVG moons) and reverts on unmount.
 * With reduced motion nothing is created and the static composition is shown.
 */
export function useHeroScroll(track: RefObject<HTMLElement | null>) {
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = track.current
    if (!el || reduced) return undefined

    let cancelled = false
    let revert: (() => void) | undefined

    const init = async () => {
      const { gsap } = await loadGsap()
      if (cancelled) return
      const mobile = window.matchMedia('(max-width: 640px)').matches
      const q = gsap.utils.selector(el)

      const ctx = gsap.context(() => {
        gsap.set(q('.hero__planet, .hero__orbits, .hero__ridge'), { transformOrigin: DIVE_ORIGIN })

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
        })

        // Far layers drift slowly, near layers rush past: that speed difference is the depth.
        tl.to(q('.hero__stars'), { scale: 1.25, duration: 1 }, 0)
        tl.to(q('.hero__nebula'), { scale: 1.2, yPercent: -6, duration: 1 }, 0)
        tl.to(q('.hero__title'), { scale: 1.6, opacity: 0, duration: 0.9 }, 0)
        tl.to(q('.hero__planet, .hero__orbits'), { scale: mobile ? 2.2 : 2.7, yPercent: mobile ? -14 : -22, duration: 1 }, 0)
        tl.to(q('.hero__ridge'), { scale: 1.9, duration: 1 }, 0)
        tl.to(q('.hero__ridge'), { opacity: 0, duration: 0.3 }, 0.7)

        // The headline lifts and grows into the viewer while the call to action stays usable.
        tl.to(q('.hero__h1'), { scale: 1.35, yPercent: -8, duration: 0.8 }, 0.1)
        tl.to(q('.hero__h1'), { opacity: 0, duration: 0.3 }, 0.55)
        tl.to(q('.hero__eyebrow, .hero__tagline'), { opacity: 0, yPercent: -30, duration: 0.3 }, 0.35)
        tl.to(q('.hero__ctas, .hero__stats, .hero__next, .hero__scroll-cue'), { opacity: 0, duration: 0.2 }, 0.78)
        tl.to(q('.hero__fog'), { opacity: 1, duration: 0.25 }, 0.75)

        // Moons ride their elliptical orbits; the far half of an orbit dims for depth.
        const moons = ORBITS.map((spec, i) => ({
          spec,
          node: el.querySelector<SVGCircleElement>(`[data-orbit="${i}"]`),
        }))
        const progress = { t: 0 }
        tl.to(
          progress,
          {
            t: 1,
            duration: 1,
            onUpdate: () => {
              for (const { spec, node } of moons) {
                if (!node) continue
                const point = orbitPoint(spec, spec.start + progress.t * Math.PI * 2.4 * spec.speed)
                node.setAttribute('cx', point.x.toFixed(1))
                node.setAttribute('cy', point.y.toFixed(1))
                node.style.opacity = point.front ? '0.9' : '0.3'
              }
            },
          },
          0,
        )
      }, el)

      revert = () => ctx.revert()
    }

    // The scene is already composed and pinned by CSS; the scrub only needs to exist once the visitor scrolls.
    const cancelWait = afterFirstInteraction(() => void init())

    return () => {
      cancelled = true
      cancelWait()
      revert?.()
    }
  }, [track, reduced])
}
