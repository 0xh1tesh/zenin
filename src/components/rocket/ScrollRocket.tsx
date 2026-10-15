import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { prefersReducedMotion, useReducedMotion } from '../../lib/motion'
import {
  calculateScrollProgress,
  computeFlameScale,
  computePathDimensions,
  computePathPoint,
  computePathTangent,
  computeRocketAngle,
  generateSvgPathString,
  isLanded,
  LANDING_THRESHOLD,
  lerp,
  lerpAngle,
  type PathDimensions,
  shouldEmitParticle,
  smoothVelocity,
} from './flight'
import { LandingPad } from './LandingPad'
import {
  createParticlePool,
  emitParticle,
  MAX_PARTICLES_DESKTOP,
  MAX_PARTICLES_MOBILE,
  updateParticles,
} from './particles'
import { RocketCraft } from './RocketCraft'
import './rocket.css'

/**
 * ScrollRocket: A code-drawn cosmic rocket that travels with the visitor
 * along a gentle S-curve track, orienting with scroll direction, responding to
 * scroll velocity with dynamic flame and particle trail, and docking at touchdown.
 */
export default function ScrollRocket() {
  const location = useLocation()
  const reducedMotion = useReducedMotion()

  const [isLandedState, setIsLandedState] = useState(false)
  const [isDockVisible, setIsDockVisible] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [dims, setDims] = useState<PathDimensions>(() =>
    computePathDimensions(
      typeof window !== 'undefined' ? window.innerWidth : 1200,
      typeof window !== 'undefined' ? window.innerHeight : 800,
      typeof window !== 'undefined' ? window.innerWidth < 640 : false
    )
  )

  // DOM element references
  const containerRef = useRef<HTMLDivElement>(null)
  const moverRef = useRef<HTMLDivElement>(null)
  const fgPathRef = useRef<SVGPathElement>(null)
  const particleElsRef = useRef<(HTMLSpanElement | null)[]>([])

  // Animation & physics state refs (no React re-renders on frame ticks)
  const rafIdRef = useRef<number | null>(null)
  const targetProgressRef = useRef(0)
  const currentProgressRef = useRef(0)
  const currentAngleRef = useRef(180)
  const lastScrollYRef = useRef(0)
  const lastScrollTimeRef = useRef(0)
  const velocityRef = useRef(0)
  const isScrollingUpRef = useRef(false)
  const dimsRef = useRef(dims)
  dimsRef.current = dims

  // Particle pool allocated once
  const particlePoolRef = useRef(createParticlePool(MAX_PARTICLES_DESKTOP))

  // Path geometry data string
  const pathD = useMemo(() => generateSvgPathString(dims, 60), [dims])

  // Setup stroke-dasharray on trajectory foreground path when path changes
  useLayoutEffect(() => {
    if (fgPathRef.current) {
      try {
        const totalLength = fgPathRef.current.getTotalLength()
        fgPathRef.current.style.strokeDasharray = `${totalLength} ${totalLength}`
        fgPathRef.current.style.strokeDashoffset = `${totalLength * (1 - currentProgressRef.current)}`
      } catch {
        // Fallback if SVG geometry is not yet measured
      }
    }
  }, [pathD])

  // Responsive dimension updates & ResizeObserver on document.body
  useEffect(() => {
    const updateDimensions = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const isMobile = w < 640
      const nextDims = computePathDimensions(w, h, isMobile)
      setDims(nextDims)
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions, { passive: true })

    const observer = new ResizeObserver(() => {
      // Recalculate target progress when document body height changes (async content)
      const scrollY = window.scrollY || window.pageYOffset || 0
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0
      const innerHeight = window.innerHeight || 0
      targetProgressRef.current = calculateScrollProgress(scrollY, scrollHeight, innerHeight)
      scheduleFrame()
    })

    if (document.body) {
      observer.observe(document.body)
    }

    return () => {
      window.removeEventListener('resize', updateDimensions)
      observer.disconnect()
    }
  }, [])

  // Single rAF frame execution
  const tick = useCallback(() => {
    rafIdRef.current = null
    const currentDims = dimsRef.current
    const targetP = targetProgressRef.current
    let currP = currentProgressRef.current

    // Linear easing (settles within ~200-250ms)
    currP = lerp(currP, targetP, 0.18)
    currentProgressRef.current = currP

    // Smooth velocity decay
    velocityRef.current = smoothVelocity(velocityRef.current, 0, 0.12)
    const vel = velocityRef.current

    // Check landing threshold
    const landed = isLanded(currP, LANDING_THRESHOLD)
    setIsLandedState(landed)
    setIsDockVisible(currP > 0.93)

    // Compute path point and tangent
    const pt = computePathPoint(currP, currentDims)
    const tangent = computePathTangent(currP, currentDims)
    const targetAngle = computeRocketAngle(tangent.dx, tangent.dy, isScrollingUpRef.current)
    const nextAngle = lerpAngle(currentAngleRef.current, targetAngle, 0.18)
    currentAngleRef.current = nextAngle

    // Update rocket position & orientation directly via transform
    if (moverRef.current) {
      moverRef.current.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0) rotate(${nextAngle.toFixed(1)}deg)`
    }

    // Update trajectory foreground stroke-dashoffset
    if (fgPathRef.current) {
      try {
        const totalLength = fgPathRef.current.getTotalLength()
        const offset = totalLength * (1 - currP)
        fgPathRef.current.style.strokeDashoffset = `${offset.toFixed(1)}`
      } catch {
        // SVG length fallback
      }
    }

    // Dynamic flame scale update
    const flame = computeFlameScale(vel, landed, isLaunching)
    const flameEl = moverRef.current?.querySelector<SVGGElement>('.rocket-flame-group')
    if (flameEl) {
      flameEl.style.transform = `scaleY(${flame.scaleY.toFixed(2)}) scaleX(${flame.scaleX.toFixed(2)})`
      flameEl.style.opacity = `${flame.opacity.toFixed(2)}`
    }

    // Particle emissions & physics
    const isMobile = window.innerWidth < 640
    const maxParticles = isMobile ? MAX_PARTICLES_MOBILE : MAX_PARTICLES_DESKTOP

    if (shouldEmitParticle(vel, landed, isMobile, 0, maxParticles)) {
      emitParticle(
        particlePoolRef.current,
        maxParticles,
        pt.x,
        pt.y,
        nextAngle,
        isScrollingUpRef.current,
        isMobile
      )
    }

    const activeCount = updateParticles(
      particlePoolRef.current,
      particleElsRef.current,
      maxParticles
    )

    // Settling check: stop rAF loop when physical movement and particles are done
    const isSettled =
      Math.abs(targetP - currP) < 0.0003 && vel < 0.01 && activeCount === 0 && !isLaunching

    if (isSettled) {
      currentProgressRef.current = targetP
      rafIdRef.current = null
    } else {
      scheduleFrame()
    }
  }, [isLaunching])

  const scheduleFrame = useCallback(() => {
    if (typeof document !== 'undefined' && document.hidden) return
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(tick)
    }
  }, [tick])

  // Passive scroll listener writing to refs
  useEffect(() => {
    lastScrollYRef.current = window.scrollY || window.pageYOffset || 0
    lastScrollTimeRef.current = performance.now()

    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0
      const innerHeight = window.innerHeight || 0

      // Direction detection
      const deltaY = scrollY - lastScrollYRef.current
      if (Math.abs(deltaY) > 1) {
        isScrollingUpRef.current = deltaY < 0
      }

      // Velocity calculation
      const now = performance.now()
      const dt = Math.max(1, now - lastScrollTimeRef.current)
      const rawSpeed = Math.abs(deltaY) / dt
      velocityRef.current = smoothVelocity(velocityRef.current, rawSpeed * 16, 0.4)

      lastScrollYRef.current = scrollY
      lastScrollTimeRef.current = now

      targetProgressRef.current = calculateScrollProgress(scrollY, scrollHeight, innerHeight)

      if (reducedMotion) {
        // Under reduced motion: snap position instantly without loop or spring
        currentProgressRef.current = targetProgressRef.current
        const pt = computePathPoint(targetProgressRef.current, dimsRef.current)
        const tangent = computePathTangent(targetProgressRef.current, dimsRef.current)
        const angle = computeRocketAngle(tangent.dx, tangent.dy, isScrollingUpRef.current)
        if (moverRef.current) {
          moverRef.current.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0) rotate(${angle}deg)`
        }
        const landed = isLanded(targetProgressRef.current, LANDING_THRESHOLD)
        setIsLandedState(landed)
        setIsDockVisible(targetProgressRef.current > 0.93)
      } else {
        scheduleFrame()
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [reducedMotion, scheduleFrame])

  // Pause rAF loop when tab is hidden, resume when visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }
      } else {
        scheduleFrame()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [scheduleFrame])

  // Route transition handling: recompute on route navigation
  useEffect(() => {
    const scrollY = window.scrollY || window.pageYOffset || 0
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0
    const innerHeight = window.innerHeight || 0
    targetProgressRef.current = calculateScrollProgress(scrollY, scrollHeight, innerHeight)
    scheduleFrame()
  }, [location.pathname, scheduleFrame])

  // 'Launch again' button handler
  const handleLaunchAgain = useCallback(() => {
    setIsLaunching(true)
    isScrollingUpRef.current = true
    const reduced = prefersReducedMotion()

    window.scrollTo({
      top: 0,
      behavior: reduced ? 'auto' : 'smooth',
    })

    const timer = setTimeout(() => {
      setIsLaunching(false)
      isScrollingUpRef.current = false
    }, 900)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      ref={containerRef}
      className="rocket-overlay"
      aria-hidden="true"
    >
      {/* Flight trajectory lines */}
      <svg
        className="rocket-track-svg"
        viewBox={`0 0 ${dims.overlayWidth} ${window.innerHeight || 800}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={pathD} className="rocket-track-bg" />
        <path ref={fgPathRef} d={pathD} className="rocket-track-fg" />
      </svg>

      {/* Sparse exhaust particle pool */}
      {!reducedMotion && (
        <div className="rocket-particles" aria-hidden="true">
          {Array.from({ length: MAX_PARTICLES_DESKTOP }).map((_, i) => (
            <span
              key={i}
              ref={(el) => {
                particleElsRef.current[i] = el
              }}
              className="rocket-particle"
            />
          ))}
        </div>
      )}

      {/* Rocket mover */}
      <div ref={moverRef} className="rocket-mover">
        <RocketCraft isLanded={isLandedState} isLaunching={isLaunching} />
      </div>

      {/* Touchdown docking pad & Launch again button */}
      <LandingPad
        isLanded={isLandedState}
        isVisible={isDockVisible}
        onLaunchAgain={handleLaunchAgain}
      />
    </div>
  )
}
