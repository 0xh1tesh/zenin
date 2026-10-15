import { useEffect, useMemo, useRef } from 'react'
import { afterFirstInteraction, useReducedMotion } from '../../lib/motion'
import {
  CONSTELLATIONS,
  computeConstellationPath,
  computeConstellationPathLength,
  generateBlinkingStars,
  type BlinkingStar,
  type ConstellationSpec,
} from './heroSky.ts'

interface ConstellationRenderData {
  spec: ConstellationSpec
  pathD: string
  pathLen: number
}

/**
 * HeroSky — The living cosmic sky above the planet in Zenin '26.
 *
 * Adds:
 * 1) 5 real-looking constellations with sequential stroke-dashoffset line-drawing,
 *    star pulsing, and mono label reveals (scaled/limited to 2-3 on mobile).
 * 2) 34 deterministic blinking stars (slow twinkle, quick double-blink, color shift,
 *    and 5 bright hero stars with cross diffraction spikes).
 * 3) Celestial bodies: ringed gas giant with rotating atmospheric bands, thin crescent moon,
 *    faint rotating spiral galaxy smudge, drifting soft aurora ribbon, 15s crossing satellite,
 *    and 2 distant expanding pulsars.
 * 4) Desktop mouse parallax throttled by rAF (disabled on touch/reduced motion).
 *
 * All elements aria-hidden, pointer-events none, z-index 1 (under planet & headline scrim).
 */
export default function HeroSky() {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const deepRef = useRef<HTMLDivElement>(null)
  const midRef = useRef<HTMLDivElement>(null)
  const nearRef = useRef<HTMLDivElement>(null)

  // Compute constellation geometries once statically
  const constellationData = useMemo<ConstellationRenderData[]>(() => {
    return CONSTELLATIONS.map((spec) => ({
      spec,
      pathD: computeConstellationPath(spec),
      pathLen: computeConstellationPathLength(spec),
    }))
  }, [])

  // Generate deterministic stars once
  const stars = useMemo<BlinkingStar[]>(() => generateBlinkingStars(), [])
  const deepStars = useMemo(() => stars.filter((s) => s.layer === 'deep'), [stars])
  const midStars = useMemo(() => stars.filter((s) => s.layer === 'mid'), [stars])
  const nearStars = useMemo(() => stars.filter((s) => s.layer === 'near'), [stars])

  // Desktop subtle mouse parallax (rAF-throttled, starts after first interaction)
  useEffect(() => {
    if (reduced) return undefined
    const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
    if (isTouch) return undefined

    const root = rootRef.current
    if (!root) return undefined

    let cancelled = false
    let rafId = 0
    let visible = true
    let docVisible = typeof document !== 'undefined' ? !document.hidden : true

    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const onPointerMove = (e: PointerEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2
      targetY = (e.clientY / window.innerHeight - 0.5) * 2
    }

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            ([entry]) => {
              visible = entry.isIntersecting
            },
            { threshold: 0 },
          )
        : null
    io?.observe(root)

    const onVisibility = () => {
      docVisible = !document.hidden
    }
    document.addEventListener('visibilitychange', onVisibility)

    const tick = () => {
      if (cancelled) return
      if (visible && docVisible) {
        currentX += (targetX - currentX) * 0.05
        currentY += (targetY - currentY) * 0.05

        if (deepRef.current) {
          const dx = (currentX * 6).toFixed(2)
          const dy = (currentY * 4).toFixed(2)
          deepRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
        }
        if (midRef.current) {
          const mx = (currentX * 12).toFixed(2)
          const my = (currentY * 8).toFixed(2)
          midRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`
        }
        if (nearRef.current) {
          const nx = (currentX * 18).toFixed(2)
          const ny = (currentY * 12).toFixed(2)
          nearRef.current.style.transform = `translate3d(${nx}px, ${ny}px, 0)`
        }
      }
      rafId = requestAnimationFrame(tick)
    }

    const cancelInteraction = afterFirstInteraction(() => {
      if (cancelled) return
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      rafId = requestAnimationFrame(tick)
    }, 2000)

    return () => {
      cancelled = true
      cancelInteraction()
      window.removeEventListener('pointermove', onPointerMove)
      cancelAnimationFrame(rafId)
      io?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduced])

  const renderStar = (star: BlinkingStar) => {
    const isHero = star.behavior === 'hero-star'
    const glint = star.glintSize ?? 6

    return (
      <div
        key={star.id}
        className={`hero-sky__star hero-sky__star--${star.behavior}`}
        style={
          {
            left: `${star.x}%`,
            top: `${star.y}%`,
            '--dur': `${star.duration}s`,
            '--del': `${star.delay}s`,
          } as React.CSSProperties
        }
      >
        <span
          className="hero-sky__star-dot"
          style={{ width: `${star.r * 2}px`, height: `${star.r * 2}px` }}
        />
        {isHero && (
          <svg
            className="hero-sky__star-spikes"
            width={glint * 2}
            height={glint * 2}
            viewBox={`-${glint} -${glint} ${glint * 2} ${glint * 2}`}
          >
            <line x1={-glint} y1={0} x2={glint} y2={0} stroke="var(--bone)" strokeWidth="0.8" />
            <line x1={0} y1={-glint} x2={0} y2={glint} stroke="var(--bone)" strokeWidth="0.8" />
            <line
              x1={-glint * 0.45}
              y1={-glint * 0.45}
              x2={glint * 0.45}
              y2={glint * 0.45}
              stroke="var(--sand)"
              strokeWidth="0.45"
              opacity="0.5"
            />
            <line
              x1={-glint * 0.45}
              y1={glint * 0.45}
              x2={glint * 0.45}
              y2={-glint * 0.45}
              stroke="var(--sand)"
              strokeWidth="0.45"
              opacity="0.5"
            />
          </svg>
        )}
      </div>
    )
  }

  return (
    <div className="hero-sky" ref={rootRef} aria-hidden="true">
      {/* SVG Definitions for userSpaceOnUse Glow Filter (satisfies hard rule 9) */}
      <svg className="sr-only" aria-hidden="true">
        <defs>
          <filter
            id="hero-sky-glow"
            filterUnits="userSpaceOnUse"
            x="-50"
            y="-50"
            width="350"
            height="350"
          >
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <clipPath id="hero-sky-gas-clip">
            <circle cx="50" cy="40" r="22" />
          </clipPath>

          <radialGradient id="hero-sky-gas-shading" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
            <stop offset="45%" stopColor="transparent" stopOpacity="0" />
            <stop offset="80%" stopColor="#101010" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#101010" stopOpacity="0.98" />
          </radialGradient>
        </defs>
      </svg>

      {/* ─── Layer 1: DEEP (Aurora, Galaxy, Deep Stars) ───────────── */}
      <div className="hero-sky__layer hero-sky__layer--deep" ref={deepRef}>
        {/* Soft Aurora / Nebula Ribbon */}
        <div className="hero-sky__aurora" />

        {/* Faint Spiral Galaxy Smudge */}
        <div className="hero-sky__galaxy">
          <div className="hero-sky__galaxy-core" />
          <div className="hero-sky__galaxy-arms" />
        </div>

        {/* Deep background blinking stars */}
        <div className="hero-sky__blinkers hero-sky__blinkers--deep">
          {deepStars.map(renderStar)}
        </div>
      </div>

      {/* ─── Layer 2: MID (Constellations, Gas Giant, Crescent Moon, Mid Stars) ─── */}
      <div className="hero-sky__layer hero-sky__layer--mid" ref={midRef}>
        {/* Distant Ringed Gas Giant */}
        <div className="hero-sky__gas-giant">
          <svg viewBox="0 0 100 80" width="88" height="70">
            {/* Tilted Ring: Back half (behind sphere) */}
            <g transform="rotate(-22 50 40)">
              <path className="hero-sky__gas-giant-ring-back" d="M 10 40 A 40 12 0 0 1 90 40" />
              <path className="hero-sky__gas-giant-ring-inner" d="M 18 40 A 32 9 0 0 1 82 40" />
            </g>

            {/* Planet Sphere with rotating banded atmosphere */}
            <circle cx="50" cy="40" r="22" fill="#181716" />
            <g clipPath="url(#hero-sky-gas-clip)">
              <g className="hero-sky__gas-giant-bands">
                <rect x="-60" y="18" width="170" height="5" fill="var(--sand)" opacity="0.75" />
                <rect x="-60" y="23" width="170" height="7" fill="var(--blue)" opacity="0.9" />
                <rect x="-60" y="30" width="170" height="4" fill="var(--sand)" opacity="0.6" />
                <rect x="-60" y="34" width="170" height="9" fill="var(--void-3)" opacity="0.9" />
                <rect x="-60" y="43" width="170" height="6" fill="var(--sand)" opacity="0.7" />
                <rect x="-60" y="49" width="170" height="7" fill="var(--blue)" opacity="0.85" />
                <rect x="-60" y="56" width="170" height="6" fill="var(--sand)" opacity="0.6" />
              </g>
              {/* 3D spherical shading overlay */}
              <circle cx="50" cy="40" r="22" fill="url(#hero-sky-gas-shading)" />
            </g>

            {/* Tilted Ring: Front half (in front of sphere) */}
            <g transform="rotate(-22 50 40)">
              <path className="hero-sky__gas-giant-ring-front" d="M 90 40 A 40 12 0 0 1 10 40" />
              <path className="hero-sky__gas-giant-ring-inner" d="M 82 40 A 32 9 0 0 1 18 40" />
            </g>
          </svg>
        </div>

        {/* Thin Crescent Moon */}
        <div className="hero-sky__crescent-moon">
          <svg viewBox="0 0 44 44" width="38" height="38">
            <circle cx="22" cy="22" r="16" className="hero-sky__crescent-moon-earthshine" />
            <path
              className="hero-sky__crescent-moon-crescent"
              d="M 22 6 A 16 16 0 0 1 38 22 A 16 16 0 0 1 22 38 A 14.2 16 0 0 0 22 6 Z"
              transform="rotate(-16 22 22)"
            />
          </svg>
        </div>

        {/* 5 Real-Looking Constellations */}
        <div className="hero-sky__constellations">
          {constellationData.map(({ spec, pathD, pathLen }, index) => {
            const delaySec = index * 5
            return (
              <div
                key={spec.id}
                className="hero-sky__constellation"
                data-constellation={spec.id}
                data-hide-mobile={spec.mobilePlacement?.hideOnMobile ? 'true' : 'false'}
                style={{
                  top: spec.desktopPlacement.top,
                  left: spec.desktopPlacement.left,
                  right: spec.desktopPlacement.right,
                  width: spec.desktopPlacement.width,
                  height: spec.desktopPlacement.height,
                  '--delay': `${delaySec}s`,
                } as React.CSSProperties}
              >
                <svg
                  viewBox={`0 0 ${spec.viewBox.width} ${spec.viewBox.height}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Faint ambient hairline lines */}
                  <path className="hero-sky__constellation-ambient" d={pathD} />

                  {/* Active glowing tracer line */}
                  <path
                    className="hero-sky__constellation-tracer"
                    d={pathD}
                    style={{ '--path-len': pathLen } as React.CSSProperties}
                  />

                  {/* Constellation Stars */}
                  {spec.stars.map((s) => (
                    <g key={s.id} className="hero-sky__constellation-star-group">
                      <circle
                        className="hero-sky__constellation-star-halo"
                        cx={s.x}
                        cy={s.y}
                        r={s.r * 2.2}
                      />
                      <circle
                        className={`hero-sky__constellation-star${s.isAlpha ? ' hero-sky__constellation-star--alpha' : ''}`}
                        cx={s.x}
                        cy={s.y}
                        r={s.r}
                      />
                    </g>
                  ))}

                  {/* Tiny Mono Constellation Label */}
                  <text
                    className="hero-sky__constellation-label mono"
                    x={spec.labelPos.x}
                    y={spec.labelPos.y}
                  >
                    {spec.name}
                  </text>
                </svg>
              </div>
            )
          })}
        </div>

        {/* Mid-layer blinking stars */}
        <div className="hero-sky__blinkers hero-sky__blinkers--mid">
          {midStars.map(renderStar)}
        </div>
      </div>

      {/* ─── Layer 3: NEAR (Pulsars, Crossing Satellite, Hero Stars) ─ */}
      <div className="hero-sky__layer hero-sky__layer--near" ref={nearRef}>
        {/* Distant Pulsar 1 (Upper-left flank) */}
        <div
          className="hero-sky__pulsar hero-sky__pulsar--1"
          style={{ left: '23%', top: '16%' }}
        >
          <div className="hero-sky__pulsar-core" />
          <div className="hero-sky__pulsar-ring hero-sky__pulsar-ring--1" />
          <div className="hero-sky__pulsar-ring hero-sky__pulsar-ring--2" />
        </div>

        {/* Distant Pulsar 2 (Upper-right flank) */}
        <div
          className="hero-sky__pulsar hero-sky__pulsar--2"
          style={{ left: '73%', top: '22%' }}
        >
          <div className="hero-sky__pulsar-core" />
          <div className="hero-sky__pulsar-ring hero-sky__pulsar-ring--1" />
          <div className="hero-sky__pulsar-ring hero-sky__pulsar-ring--2" />
        </div>

        {/* Tiny Crossing Satellite / ISS Dot */}
        <div className="hero-sky__satellite">
          <div className="hero-sky__satellite-solar" />
          <div className="hero-sky__satellite-core" />
          <div className="hero-sky__satellite-light" />
        </div>

        {/* Near-layer & Hero Stars */}
        <div className="hero-sky__blinkers hero-sky__blinkers--near">
          {nearStars.map(renderStar)}
        </div>
      </div>
    </div>
  )
}
