import { useEffect, type RefObject } from 'react'
import { afterFirstInteraction, loadGsap, useReducedMotion } from '../../lib/motion'
import {
  ORBITS,
  orbitPoint,
  buildTailPath,
  computeOrbitDashOffset,
  type OrbitSpec,
} from './Orbits'

const DIVE_ORIGIN = '50% 100%'

interface MoonNodes {
  spec: OrbitSpec
  frontWrap: SVGGElement | null
  backWrap: SVGGElement | null
  frontTail: SVGPathElement | null
  backTail: SVGPathElement | null
  frontHighlight: SVGEllipseElement | null
  backHighlight: SVGEllipseElement | null
  frontTailGrad: SVGLinearGradientElement | null
  backTailGrad: SVGLinearGradientElement | null
  sparkle?: SVGElement | null
  lastFront?: boolean
}

/**
 * Orchestrates hero camera dive via GSAP and continuous real-time orbital moon motion.
 * Uses a single requestAnimationFrame loop that starts after first interaction or idle,
 * pauses when offscreen (IntersectionObserver) or hidden, and is cleaned up on unmount.
 * Scrolling adds angular velocity so moons accelerate dynamically during scroll.
 */
export function useHeroScroll(track: RefObject<HTMLElement | null>) {
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = track.current
    if (!el || reduced) return undefined

    let cancelled = false
    let revert: (() => void) | undefined
    let rafId = 0
    let isRunning = false
    let startTime = 0
    let visible = true
    let docVisible = typeof document !== 'undefined' ? !document.hidden : true
    const scrollProgress = { current: 0 }

    // Pre-query moon elements once to avoid per-frame DOM queries
    const moons: MoonNodes[] = ORBITS.map((spec, i) => ({
      spec,
      frontWrap: el.querySelector<SVGGElement>(`.hero__orbits--front [data-orbit="${i}"]`),
      backWrap: el.querySelector<SVGGElement>(`.hero__orbits--back [data-orbit="${i}"]`),
      frontTail: el.querySelector<SVGPathElement>(`.hero__orbits--front [data-tail="${i}"]`),
      backTail: el.querySelector<SVGPathElement>(`.hero__orbits--back [data-tail="${i}"]`),
      frontHighlight: el.querySelector<SVGEllipseElement>(`.hero__orbits--front [data-highlight="${i}"]`),
      backHighlight: el.querySelector<SVGEllipseElement>(`.hero__orbits--back [data-highlight="${i}"]`),
      frontTailGrad: el.querySelector<SVGLinearGradientElement>(`#hero-tail-grad-front-${i}`),
      backTailGrad: el.querySelector<SVGLinearGradientElement>(`#hero-tail-grad-back-${i}`),
      sparkle: i === 0 ? el.querySelector<SVGElement>('[data-moon-sparkle]') : null,
      lastFront: Math.sin(spec.start) > 0,
    }))

    const updateFrame = (now: number) => {
      const elapsed = (now - startTime) / 1000
      const scrollT = scrollProgress.current
      const isMobile = window.innerWidth <= 640

      for (let i = 0; i < moons.length; i++) {
        const m = moons[i]
        const spec = m.spec
        // ~48s revolution at speed=1; scroll adds 2.4 revolutions
        const idleAngle = (elapsed / 48) * (Math.PI * 2) * spec.speed
        const scrollAngle = scrollT * (Math.PI * 2) * 2.4 * spec.speed
        const angle = spec.start + idleAngle + scrollAngle

        const point = orbitPoint(spec, angle)
        const isFront = point.front
        const tail = buildTailPath(spec, angle, 0.45, 8)

        // Toggle front/back layer visibility on transition
        if (m.lastFront !== isFront) {
          m.lastFront = isFront
          if (m.frontWrap) m.frontWrap.style.display = isFront ? '' : 'none'
          if (m.backWrap) m.backWrap.style.display = isFront ? 'none' : ''
          if (m.frontTail) m.frontTail.style.display = isFront ? '' : 'none'
          if (m.backTail) m.backTail.style.display = isFront ? 'none' : ''
          if (m.frontHighlight) m.frontHighlight.style.display = isFront ? '' : 'none'
          if (m.backHighlight) m.backHighlight.style.display = isFront ? 'none' : ''
        }

        const activeWrap = isFront ? m.frontWrap : m.backWrap
        const activeTail = isFront ? m.frontTail : m.backTail
        const activeHighlight = isFront ? m.frontHighlight : m.backHighlight
        const activeGrad = isFront ? m.frontTailGrad : m.backTailGrad

        if (activeWrap) {
          activeWrap.setAttribute('transform', `translate(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`)
        }
        if (activeTail) {
          activeTail.setAttribute('d', tail.d)
        }
        if (activeHighlight) {
          const dashOffset = computeOrbitDashOffset(spec.rx, spec.ry, angle, 50)
          activeHighlight.setAttribute('stroke-dashoffset', dashOffset.toFixed(1))
        }

        // On desktop: update gradient endpoints and lens flare sparkle
        if (!isMobile) {
          if (activeGrad) {
            activeGrad.setAttribute('x1', tail.head.x.toFixed(1))
            activeGrad.setAttribute('y1', tail.head.y.toFixed(1))
            activeGrad.setAttribute('x2', tail.tail.x.toFixed(1))
            activeGrad.setAttribute('y2', tail.tail.y.toFixed(1))
          }

          if (i === 0 && m.sparkle) {
            const sinA = Math.sin(angle)
            if (isFront && sinA > 0.85) {
              const flareIntensity = (sinA - 0.85) / 0.15
              const twinkle = flareIntensity * (0.7 + 0.3 * Math.sin(now * 0.012))
              m.sparkle.setAttribute('opacity', twinkle.toFixed(2))
              const flareScale = (0.7 + 0.5 * flareIntensity).toFixed(2)
              const rot = ((now * 0.04) % 360).toFixed(1)
              m.sparkle.setAttribute('transform', `scale(${flareScale}) rotate(${rot})`)
            } else {
              m.sparkle.setAttribute('opacity', '0')
            }
          }
        }
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
      },
      { threshold: 0 },
    )
    io.observe(el)

    const onVisibility = () => {
      docVisible = !document.hidden
    }
    document.addEventListener('visibilitychange', onVisibility)

    const startLoop = () => {
      if (isRunning || cancelled || reduced) return
      isRunning = true
      startTime = performance.now()

      const tick = (now: number) => {
        if (cancelled) return
        if (visible && docVisible) {
          updateFrame(now)
        }
        rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    }

    // Initialize GSAP scroll timeline
    const initGsap = async () => {
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
        tl.to(q('.hero-sky__constellations'), { scale: 1.15, yPercent: -4, duration: 1 }, 0)
        tl.to(q('.hero-sky__gas-giant'), { yPercent: -20, scale: 1.2, duration: 1 }, 0)
        tl.to(q('.hero-sky__crescent-moon'), { yPercent: -15, scale: 1.12, duration: 1 }, 0)
        tl.to(q('.hero-sky__galaxy'), { yPercent: -12, scale: 1.15, duration: 1 }, 0)
        tl.to(q('.hero-sky__blinkers'), { scale: 1.18, duration: 1 }, 0)
        tl.to(q('.hero-sky__aurora'), { yPercent: -8, opacity: 0.05, duration: 0.85 }, 0)
        tl.to(q('.hero__title'), { scale: 1.6, opacity: 0, duration: 0.9 }, 0)
        tl.to(q('.hero__planet, .hero__orbits'), { scale: mobile ? 2.2 : 2.7, yPercent: mobile ? -14 : -22, duration: 1 }, 0)
        tl.to(q('.hero__ridge'), { scale: 1.9, duration: 1 }, 0)
        tl.to(q('.hero__ridge'), { opacity: 0, duration: 0.3 }, 0.7)
        tl.to(q('.hero-sky'), { opacity: 0, duration: 0.25 }, 0.75)

        // The headline lifts and grows into the viewer while the call to action stays usable.
        tl.to(q('.hero__h1'), { scale: 1.35, yPercent: -8, duration: 0.8 }, 0.1)
        tl.to(q('.hero__h1'), { opacity: 0, duration: 0.3 }, 0.55)
        tl.to(q('.hero__eyebrow, .hero__tagline'), { opacity: 0, yPercent: -30, duration: 0.3 }, 0.35)
        tl.to(q('.hero__ctas, .hero__stats, .hero__next, .hero__scroll-cue'), { opacity: 0, duration: 0.2 }, 0.78)
        tl.to(q('.hero__fog'), { opacity: 1, duration: 0.25 }, 0.75)

        // Connect scroll scrub progress to our continuous orbital math
        const progressObj = { t: 0 }
        tl.to(
          progressObj,
          {
            t: 1,
            duration: 1,
            onUpdate: () => {
              scrollProgress.current = progressObj.t
            },
          },
          0,
        )
      }, el)

      revert = () => ctx.revert()
    }

    // Start rAF loop on idle or first interaction
    let idleTimer: number | undefined
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleTimer = window.requestIdleCallback(() => startLoop(), { timeout: 2000 })
    }

    const cancelWait = afterFirstInteraction(() => {
      startLoop()
      void initGsap()
    }, 2500)

    return () => {
      cancelled = true
      cancelWait()
      if (idleTimer !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleTimer)
      }
      cancelAnimationFrame(rafId)
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      revert?.()
    }
  }, [track, reduced])
}
