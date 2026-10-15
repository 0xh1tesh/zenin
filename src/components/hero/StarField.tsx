import { useRef, useEffect, useCallback } from 'react'
import { useReducedMotion } from '../../lib/motion'

interface Star {
  x: number
  y: number
  r: number
  /** 0 = far, 1 = near — drives parallax depth */
  depth: number
  /** Base brightness 0..1 */
  base: number
  /** Twinkle phase offset */
  phase: number
  /** Twinkle speed multiplier */
  speed: number
  /** Subtle cross glint on selected bright hero stars */
  isHero?: boolean
  glintSize?: number
}

function createStars(count: number, w: number, h: number, isMobile: boolean): Star[] {
  const stars: Star[] = []
  const heroCount = isMobile ? 3 : 6

  for (let i = 0; i < count; i++) {
    const isHero = i < heroCount
    const depth = isHero ? 1 : Math.random() > 0.6 ? 1 : 0
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: isHero
        ? 1.3 + Math.random() * 0.6
        : depth === 1
          ? 0.6 + Math.random() * 1.2
          : 0.3 + Math.random() * 0.6,
      depth,
      base: isHero ? 0.75 + Math.random() * 0.25 : 0.4 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.7,
      isHero,
      glintSize: isHero ? 4.5 + Math.random() * 3.5 : undefined,
    })
  }
  return stars
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  time: number,
  animate: boolean,
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  for (const s of stars) {
    const alpha = animate
      ? s.base * (0.55 + 0.45 * Math.sin(time * 0.001 * s.speed + s.phase))
      : s.base
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(234,230,222,${alpha})`
    ctx.fill()

    if (s.isHero && s.glintSize) {
      const glintAlpha = alpha * 0.65
      ctx.strokeStyle = `rgba(234,230,222,${glintAlpha})`
      ctx.lineWidth = 0.75
      ctx.beginPath()
      ctx.moveTo(s.x - s.glintSize, s.y)
      ctx.lineTo(s.x + s.glintSize, s.y)
      ctx.moveTo(s.x, s.y - s.glintSize)
      ctx.lineTo(s.x, s.y + s.glintSize)
      ctx.stroke()
    }
  }
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const starsRef = useRef<Star[]>([])
  const rafRef = useRef(0)

  const setup = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const rect = canvas.getBoundingClientRect()
    const w = rect.width * dpr
    const h = rect.height * dpr
    canvas.width = w
    canvas.height = h

    const isMobile = rect.width <= 640
    const count = isMobile ? 70 : 140
    starsRef.current = createStars(count, w, h, isMobile)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    /* Draw initial static frame */
    drawStars(ctx, starsRef.current, 0, false)
  }, [])

  useEffect(() => {
    setup()

    const canvas = canvasRef.current
    if (!canvas || reduced) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let visible = true
    let docVisible = !document.hidden

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
      },
      { threshold: 0 },
    )
    io.observe(canvas)

    const onVisibility = () => {
      docVisible = !document.hidden
    }
    document.addEventListener('visibilitychange', onVisibility)

    const tick = (time: number) => {
      if (visible && docVisible) {
        drawStars(ctx, starsRef.current, time, true)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduced, setup])

  return (
    <div className="hero__stars" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}
