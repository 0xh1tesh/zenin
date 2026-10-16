import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { prefersReducedMotion, useReducedMotion, PHONE_QUERY } from '../../lib/motion'
import {
  calculateScrollProgress,
  computeFlameScale,
  computePathDimensions,
  fitToGutter,
  computePathPoint,
  computePathTangent,
  computeReentryHeat,
  computeRocketAngle,
  computeSeparationState,
  DOCK_THRESHOLD,
  formatAltitude,
  generateSvgPathString,
  getActiveSectionTitle,
  isLanded,
  LANDING_THRESHOLD,
  lerp,
  lerpAngle,
  type PathDimensions,
  REENTRY_START_PROGRESS,
  shouldEmitParticle,
  smoothVelocity,
} from './flight'
import { LandingPad } from './LandingPad'
import { OrbitalDock } from './OrbitalDock'
import {
  createParticlePool,
  emitParticle,
  MAX_PARTICLES_DESKTOP,
  MAX_PARTICLES_MOBILE,
  updateParticles,
} from './particles'
import { ParticleTrail } from './ParticleTrail'
import { RocketCraft } from './RocketCraft'
import { useWaypoints } from './useWaypoints'
import { WaypointBeacons } from './WaypointBeacons'
import './rocket.css'

const DOCK_VISIBLE_AT = 0.93
/** The holding ring (68px) only appears where the margin beside the content can hold it. */
const DOCK_RING_MIN_GUTTER = 72

const FIXED_CHROME = '.topbar, .rail, .bottom-nav, .rocket-overlay, .sr-only, [aria-hidden="true"]'

/**
 * Width of the empty margin between the rightmost piece of page content (any visible text, or a content
 * column's edge) and the viewport edge. Measured on resize and route change only, never per frame.
 */
function measureContentGutter(): number {
  const viewportWidth = document.documentElement.clientWidth
  const root = document.getElementById('root')
  if (!root) return 44
  let contentRight = 0
  for (const container of root.querySelectorAll<HTMLElement>('main .container, footer .container')) {
    const box = container.getBoundingClientRect()
    if (box.width === 0) continue
    contentRight = Math.max(contentRight, box.right - parseFloat(getComputedStyle(container).paddingRight))
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  while (walker.nextNode()) {
    const node = walker.currentNode
    const owner = node.parentElement
    if (!node.textContent?.trim() || !owner || owner.closest(FIXED_CHROME)) continue
    range.selectNodeContents(node)
    for (const rect of range.getClientRects()) {
      // Text further right than the viewport is inside a horizontal scroller, not page content.
      if (rect.width > 0 && rect.right <= viewportWidth) contentRight = Math.max(contentRight, rect.right)
    }
  }
  return contentRight > 0 ? Math.max(0, viewportWidth - contentRight - 2) : 44
}
/** Clear space between the readout's right edge and the craft's centre line (craft + flame reach ~24px). */
const HUD_GAP = 44
const POS_EASE = 0.35
const PAD_SURFACE_Y = 14

export default function ScrollRocket() {
  const location = useLocation()
  const reducedMotion = useReducedMotion()

  const [isLandedState, setIsLandedState] = useState(false)
  const [isDockVisible, setIsDockVisible] = useState(false)
  const [isDockedState, setIsDockedState] = useState(true)
  const [isSeparatedState, setIsSeparatedState] = useState(false)
  const [justSeparated, setJustSeparated] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [activeBeaconIdx, setActiveBeaconIdx] = useState(0)
  const [ripplingIdx, setRipplingIdx] = useState<number | null>(null)
  const { beacons, updateBeacons } = useWaypoints(location.pathname)

  const [craftScale, setCraftScale] = useState(1)
  const craftScaleRef = useRef(1)
  const [dims, setDims] = useState<PathDimensions>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200
    const h = typeof window !== 'undefined' ? window.innerHeight : 800
    return computePathDimensions(w, h, w < 640)
  })

  /** Re-fits the flight corridor to the empty margin right of the page content (never over text). */
  const refitTrack = useCallback(() => {
    const fit = fitToGutter(measureContentGutter())
    craftScaleRef.current = fit.craftScale
    setCraftScale(fit.craftScale)
    setDims({
      ...computePathDimensions(window.innerWidth, window.innerHeight, window.innerWidth < 640),
      overlayWidth: fit.overlayWidth,
      centerOffset: fit.centerOffset,
      amplitude: fit.amplitude,
    })
  }, [])

  const containerRef = useRef<HTMLDivElement>(null)
  const moverRef = useRef<HTMLDivElement>(null)
  const fgPathRef = useRef<SVGPathElement>(null)
  const hudContainerRef = useRef<HTMLDivElement>(null)
  const hudAltRef = useRef<HTMLSpanElement>(null)
  const hudSectionRef = useRef<HTMLDivElement>(null)
  const particleElsRef = useRef<(HTMLSpanElement | null)[]>([])

  const rafIdRef = useRef<number | null>(null)
  const targetProgressRef = useRef(0)
  const currentProgressRef = useRef(0)
  const currentAngleRef = useRef(180)
  const lastScrollYRef = useRef(0)
  const lastScrollTimeRef = useRef(0)
  const velocityRef = useRef(0)
  const isScrollingUpRef = useRef(false)
  const isDockedRef = useRef(true)
  const isSeparatedRef = useRef(false)
  const activeBeaconIdxRef = useRef(0)
  const beaconsRef = useRef(beacons)
  beaconsRef.current = beacons
  const dimsRef = useRef(dims)
  dimsRef.current = dims

  const hudIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dockStateRef = useRef({ landed: false, visible: false })
  const syncDockState = useCallback((landed: boolean, visible: boolean) => {
    if (dockStateRef.current.landed !== landed) setIsLandedState(landed)
    if (dockStateRef.current.visible !== visible) setIsDockVisible(visible)
    dockStateRef.current = { landed, visible }
  }, [])

  const posRef = useRef<{ x: number; y: number } | null>(null)

  const padAnchor = useCallback((): { x: number; y: number } | null => {
    const pad = containerRef.current?.querySelector('.rocket-dock__svg')
    if (!containerRef.current || !pad) return null
    const pBox = pad.getBoundingClientRect()
    const oBox = containerRef.current.getBoundingClientRect()
    const halfH = 24 * craftScaleRef.current
    return { x: pBox.left - oBox.left + pBox.width / 2, y: pBox.top - oBox.top + PAD_SURFACE_Y - halfH }
  }, [])

  // A new page brings a new content width; re-fit once it has rendered.
  useEffect(() => {
    refitTrack()
    const timer = setTimeout(refitTrack, 600)
    return () => clearTimeout(timer)
  }, [location.pathname, refitTrack])

  const particlePoolRef = useRef(createParticlePool(MAX_PARTICLES_DESKTOP))
  const pathD = useMemo(() => generateSvgPathString(dims, 60), [dims])
  const dockPoint = useMemo(() => computePathPoint(0, dims), [dims])

  // The trail's length only changes with the path, so it is measured here once, not on every frame.
  const trailLengthRef = useRef(0)

  useLayoutEffect(() => {
    if (fgPathRef.current) {
      try {
        const total = fgPathRef.current.getTotalLength()
        trailLengthRef.current = total
        fgPathRef.current.style.strokeDasharray = `${total} ${total}`
        fgPathRef.current.style.strokeDashoffset = `${total * (1 - currentProgressRef.current)}`
      } catch {
        /* Geometry not ready */
      }
    }
  }, [pathD])

  useEffect(() => {
    const onResize = refitTrack
    onResize()
    window.addEventListener('resize', onResize, { passive: true })
    const obs = new ResizeObserver(() => {
      const scrollY = window.scrollY || window.pageYOffset || 0
      const scrollH = document.documentElement.scrollHeight || document.body.scrollHeight || 0
      targetProgressRef.current = calculateScrollProgress(scrollY, scrollH, window.innerHeight || 0)
      updateBeacons()
      scheduleFrame()
    })
    if (document.body) obs.observe(document.body)
    return () => {
      window.removeEventListener('resize', onResize)
      obs.disconnect()
    }
  }, [updateBeacons])

  const tick = useCallback(() => {
    rafIdRef.current = null
    const curDims = dimsRef.current
    const targetP = targetProgressRef.current
    const currP = lerp(currentProgressRef.current, targetP, 0.18)
    currentProgressRef.current = currP

    velocityRef.current = smoothVelocity(velocityRef.current, 0, 0.12)
    const vel = velocityRef.current

    const landed = isLanded(currP, LANDING_THRESHOLD)
    syncDockState(landed, currP > DOCK_VISIBLE_AT)

    const docked = currP <= DOCK_THRESHOLD
    if (docked !== isDockedRef.current) {
      isDockedRef.current = docked
      setIsDockedState(docked)
    }

    const nextSeparated = computeSeparationState(currP, isSeparatedRef.current)
    if (nextSeparated !== isSeparatedRef.current) {
      isSeparatedRef.current = nextSeparated
      setIsSeparatedState(nextSeparated)
      if (nextSeparated && !reducedMotion) {
        setJustSeparated(true)
        setTimeout(() => setJustSeparated(false), 900)
      }
    }

    const curBeacons = beaconsRef.current
    if (curBeacons.length > 0) {
      const nextIdx = curBeacons.findIndex((b) => currP < b.progress)
      const resIdx = nextIdx === -1 ? curBeacons.length : nextIdx
      if (resIdx !== activeBeaconIdxRef.current) {
        const crossed = resIdx > activeBeaconIdxRef.current ? resIdx - 1 : null
        activeBeaconIdxRef.current = resIdx
        setActiveBeaconIdx(resIdx)
        if (crossed !== null && !reducedMotion) {
          setRipplingIdx(crossed)
          setTimeout(() => setRipplingIdx(null), 650)
        }
      }
    }

    const pad = landed ? padAnchor() : null
    const target = pad ?? computePathPoint(currP, curDims)
    const prev = posRef.current ?? target
    const pt = { x: lerp(prev.x, target.x, POS_EASE), y: lerp(prev.y, target.y, POS_EASE) }
    posRef.current = pt
    const tangent = computePathTangent(currP, curDims)
    const targetAngle = pad ? 0 : computeRocketAngle(tangent.dx, tangent.dy, isScrollingUpRef.current)
    const nextAngle = lerpAngle(currentAngleRef.current, targetAngle, 0.18)
    currentAngleRef.current = nextAngle

    if (moverRef.current) {
      moverRef.current.style.transform = `translate3d(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px, 0) rotate(${nextAngle.toFixed(1)}deg)`
      const flame = computeFlameScale(vel, landed, isLaunching)
      const flameEl = moverRef.current.querySelector<SVGGElement>('.rocket-flame-group')
      if (flameEl) {
        flameEl.style.transform = `scaleY(${flame.scaleY.toFixed(2)}) scaleX(${flame.scaleX.toFixed(2)})`
        flameEl.style.opacity = `${flame.opacity.toFixed(2)}`
      }
      const reentryEl = moverRef.current.querySelector<SVGPathElement>('.rocket-reentry-glow')
      if (reentryEl) {
        const heat = reducedMotion ? 0 : computeReentryHeat(currP, vel, REENTRY_START_PROGRESS, landed)
        reentryEl.style.opacity = heat > 0 ? heat.toFixed(2) : '0'
      }
      const speedLinesEl = moverRef.current.querySelector<HTMLDivElement>('.rocket-speed-lines')
      if (speedLinesEl) {
        speedLinesEl.style.opacity = !reducedMotion && !landed && vel > 0.65 ? Math.min(1, (vel - 0.65) / 0.8).toFixed(2) : '0'
      }
    }

    if (hudContainerRef.current) {
      // The readout only rides along in flight: docked at the station or landed on the pad it would crowd the craft.
      hudContainerRef.current.classList.toggle('is-hidden', currP <= DOCK_THRESHOLD || landed)
      hudContainerRef.current.style.transform = `translate3d(${(pt.x - HUD_GAP).toFixed(1)}px, ${pt.y.toFixed(1)}px, 0) translate(-100%, -50%)`
      if (hudAltRef.current) hudAltRef.current.textContent = formatAltitude(currP)
      if (hudSectionRef.current) hudSectionRef.current.textContent = getActiveSectionTitle(curBeacons, currP, 'ORBIT')
    }

    if (fgPathRef.current && trailLengthRef.current > 0) {
      fgPathRef.current.style.strokeDashoffset = `${(trailLengthRef.current * (1 - currP)).toFixed(1)}`
    }

    const isMobile = window.innerWidth < 640
    const maxParticles = isMobile ? MAX_PARTICLES_MOBILE : MAX_PARTICLES_DESKTOP
    // Phones skip the exhaust particles entirely: scroll smoothness comes first there.
    const isPhone = window.matchMedia(PHONE_QUERY).matches

    if (!reducedMotion && !isPhone && shouldEmitParticle(vel, landed, isMobile, 0, maxParticles)) {
      emitParticle(particlePoolRef.current, maxParticles, pt.x, pt.y, nextAngle, isScrollingUpRef.current, isMobile)
    }

    const activeCount = reducedMotion || isPhone ? 0 : updateParticles(particlePoolRef.current, particleElsRef.current, maxParticles)
    const angleGap = Math.abs(((targetAngle - nextAngle + 540) % 360) - 180)
    const isSettled =
      Math.abs(targetP - currP) < 0.0003 &&
      Math.hypot(target.x - pt.x, target.y - pt.y) < 0.5 &&
      angleGap < 0.5 &&
      vel < 0.01 &&
      activeCount === 0 &&
      !isLaunching

    if (isSettled) {
      currentProgressRef.current = targetP
      rafIdRef.current = null
    } else {
      scheduleFrame()
    }
  }, [isLaunching, reducedMotion, syncDockState, padAnchor])

  const scheduleFrame = useCallback(() => {
    if (typeof document !== 'undefined' && document.hidden) return
    if (rafIdRef.current === null) rafIdRef.current = requestAnimationFrame(tick)
  }, [tick])

  useEffect(() => {
    lastScrollYRef.current = window.scrollY || window.pageYOffset || 0
    lastScrollTimeRef.current = performance.now()

    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0
      const scrollH = document.documentElement.scrollHeight || document.body.scrollHeight || 0
      const innerH = window.innerHeight || 0

      const deltaY = scrollY - lastScrollYRef.current
      if (Math.abs(deltaY) > 1) isScrollingUpRef.current = deltaY < 0

      const now = performance.now()
      const dt = Math.max(1, now - lastScrollTimeRef.current)
      velocityRef.current = smoothVelocity(velocityRef.current, (Math.abs(deltaY) / dt) * 16, 0.4)
      lastScrollYRef.current = scrollY
      lastScrollTimeRef.current = now
      targetProgressRef.current = calculateScrollProgress(scrollY, scrollH, innerH)

      if (hudContainerRef.current) {
        hudContainerRef.current.classList.remove('is-idle')
        if (hudIdleTimerRef.current !== null) clearTimeout(hudIdleTimerRef.current)
        hudIdleTimerRef.current = setTimeout(() => hudContainerRef.current?.classList.add('is-idle'), 1500)
      }

      if (reducedMotion) {
        const p = targetProgressRef.current
        currentProgressRef.current = p
        const pt = computePathPoint(p, dimsRef.current)
        const tangent = computePathTangent(p, dimsRef.current)
        const angle = computeRocketAngle(tangent.dx, tangent.dy, isScrollingUpRef.current)
        if (moverRef.current) {
          moverRef.current.style.transform = `translate3d(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px, 0) rotate(${angle}deg)`
        }
        if (hudContainerRef.current) {
          hudContainerRef.current.classList.toggle('is-hidden', p <= DOCK_THRESHOLD || isLanded(p, LANDING_THRESHOLD))
          hudContainerRef.current.style.transform = `translate3d(${(pt.x - HUD_GAP).toFixed(1)}px, ${pt.y.toFixed(1)}px, 0) translate(-100%, -50%)`
          if (hudAltRef.current) hudAltRef.current.textContent = formatAltitude(p)
          if (hudSectionRef.current)
            hudSectionRef.current.textContent = getActiveSectionTitle(beaconsRef.current, p, 'ORBIT')
        }
        syncDockState(isLanded(p, LANDING_THRESHOLD), p > DOCK_VISIBLE_AT)
        setIsDockedState(p <= DOCK_THRESHOLD)
        setIsSeparatedState(computeSeparationState(p, isSeparatedRef.current))
      } else {
        scheduleFrame()
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (hudIdleTimerRef.current !== null) clearTimeout(hudIdleTimerRef.current)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [reducedMotion, scheduleFrame, syncDockState])

  useEffect(() => {
    const handleVis = () => {
      if (document.hidden && rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      } else if (!document.hidden) {
        scheduleFrame()
      }
    }
    document.addEventListener('visibilitychange', handleVis)
    return () => document.removeEventListener('visibilitychange', handleVis)
  }, [scheduleFrame])

  useEffect(() => {
    updateBeacons()
    const scrollY = window.scrollY || window.pageYOffset || 0
    const scrollH = document.documentElement.scrollHeight || document.body.scrollHeight || 0
    targetProgressRef.current = calculateScrollProgress(scrollY, scrollH, window.innerHeight || 0)
    scheduleFrame()
  }, [location.pathname, scheduleFrame, updateBeacons])

  const handleLaunchAgain = useCallback(() => {
    setIsLaunching(true)
    isScrollingUpRef.current = true
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
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
      style={{ width: dims.overlayWidth, '--craft-scale': craftScale } as React.CSSProperties}
    >
      <svg
        className="rocket-track-svg"
        viewBox={`0 0 ${dims.overlayWidth} ${window.innerHeight || 800}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={pathD} className="rocket-track-bg" />
        <path ref={fgPathRef} d={pathD} className="rocket-track-fg" />
        <WaypointBeacons
          beacons={beacons}
          dims={dims}
          activeBeaconIdx={activeBeaconIdx}
          ripplingIdx={ripplingIdx}
        />
      </svg>

      {dims.overlayWidth >= DOCK_RING_MIN_GUTTER && (
        <OrbitalDock isDocked={isDockedState} x={dockPoint.x} y={dockPoint.y} />
      )}

      {!reducedMotion && <ParticleTrail particleElsRef={particleElsRef} />}

      <div ref={moverRef} className="rocket-mover">
        <RocketCraft
          isLanded={isLandedState}
          isLaunching={isLaunching}
          isSeparated={isSeparatedState}
          justSeparated={justSeparated}
        />
      </div>

      <LandingPad
        isLanded={isLandedState}
        isVisible={isDockVisible}
        onLaunchAgain={handleLaunchAgain}
      />
    </div>
  )
}
