import { useEffect, useRef } from 'react'
import { afterFirstInteraction, prefersReducedMotion } from '../../lib/motion'
import { computeParallaxOffset } from './deepSkyMath'
import { DeepSkyBodies } from './DeepSkyBodies'
import { DeepSkyConstellations } from './DeepSkyConstellations'
import { DeepSkyStars } from './DeepSkyStars'
import './deep-sky.css'
import './deep-sky-constellations.css'
import './deep-sky-bodies.css'

/**
 * DeepSky: The cosmic deep background layer for Zenin '26.
 *
 * Renders at fixed inset: 0, z-index: -2, pointer-events: none, aria-hidden.
 * Features:
 *  1. Deep-sky gradient wash (subtle blue top-left, vermilion bottom-right, diagonal milky way band).
 *  2. 8 real astronomical constellations cycling activation with stroke-dashoffset draw,
 *     brightening stars, and mono labels.
 *  3. 80 deterministic seeded field stars with mixed twinkles, double-blinks, and glints.
 *  4. 9 celestial bodies (ringed planet, cratered moon, ice planet, spiral galaxy, pulsars,
 *     binary star pair, drifting asteroids) peeking out along page flanks.
 *  5. Cosmic depth parallax drifting with page scroll via CSS scroll-driven animation
 *     (with passive rAF fallback after first interaction).
 */
export default function DeepSky() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // If visitor prefers reduced motion, skip all scroll listeners
    if (prefersReducedMotion()) return

    // If browser supports CSS scroll-driven animations, let native CSS handle it
    const supportsScrollTimeline =
      typeof CSS !== 'undefined' &&
      CSS.supports &&
      CSS.supports('animation-timeline', 'scroll(root)')

    if (supportsScrollTimeline) return

    let stopScroll: (() => void) | null = null

    // Defer JS scroll listener until after visitor's first interaction
    const cancelWait = afterFirstInteraction(() => {
      let rafId: number | null = null
      let lastY = -1

      const handleScroll = () => {
        if (document.hidden) return
        if (rafId !== null) return

        rafId = requestAnimationFrame(() => {
          rafId = null
          const currentY = window.scrollY
          if (currentY !== lastY && rootRef.current) {
            lastY = currentY
            const offset = computeParallaxOffset(currentY)
            rootRef.current.style.setProperty('--deepsky-scroll-offset', `${offset}px`)
          }
        })
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll()

      stopScroll = () => {
        window.removeEventListener('scroll', handleScroll)
        if (rafId !== null) cancelAnimationFrame(rafId)
      }
    })

    return () => {
      cancelWait()
      stopScroll?.()
    }
  }, [])

  return (
    <div ref={rootRef} className="deepsky-root" aria-hidden="true">
      {/* 1. Deep-sky gradient wash (painted once as CSS background) */}
      <div className="deepsky-wash" />

      {/* 2. Parallax container: drifts subtly with page scroll */}
      <div className="deepsky-parallax">
        <DeepSkyStars />
        <DeepSkyConstellations />
        <DeepSkyBodies />
      </div>
    </div>
  )
}
