import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../lib/motion'
import {
  canSpawnComet,
  computeQuadraticPoint,
  computeQuadraticTangent,
  createCometTrajectory,
  createSeededRandom,
  createStaticCometStreaks,
  generateStarDust,
  getNextSpawnInterval,
  getStarAlpha,
  isLowEndDevice,
  isSpawnDue,
  PALETTE,
  sampleTrajectoryHistory,
  shouldSkipFrame,
  type CometColorConfig,
  type Point2D,
  type RgbTriple,
  type StarDustPoint,
  type StaticCometStreak,
} from './cometMath'
import './comet-sky.css'

const MAX_COMETS = 4
const MAX_HISTORY = 44
const MAX_SPARKS = 24

interface ActiveComet {
  alive: boolean
  p0: Point2D
  pc: Point2D
  p1: Point2D
  startTime: number
  duration: number
  color: CometColorConfig
  headRadius: number
  tailWidth: number
  historyCount: number
  historyX: Float64Array
  historyY: Float64Array
  nextSparkTime: number
}

interface ActiveSpark {
  alive: boolean
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  decay: number
  size: number
  colorRgb: RgbTriple
}

function createCometPool(): ActiveComet[] {
  return Array.from({ length: MAX_COMETS }, () => ({
    alive: false,
    p0: { x: 0, y: 0 },
    pc: { x: 0, y: 0 },
    p1: { x: 0, y: 0 },
    startTime: 0,
    duration: 0,
    color: {
      type: 'standard',
      headCoreRgba: 'rgba(234, 230, 222, 0.85)',
      headGlowRgba: 'rgba(239, 133, 87, 0.45)',
      tailColorRgb: PALETTE.sand,
    },
    headRadius: 2.0,
    tailWidth: 3.2,
    historyCount: 0,
    historyX: new Float64Array(MAX_HISTORY),
    historyY: new Float64Array(MAX_HISTORY),
    nextSparkTime: 0,
  }))
}

function createSparkPool(): ActiveSpark[] {
  return Array.from({ length: MAX_SPARKS }, () => ({
    alive: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    alpha: 0,
    decay: 0.02,
    size: 1,
    colorRgb: PALETTE.coral,
  }))
}

/** Draws comet head with bone core & coral glow (max alpha 0.85). */
function drawHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  dpr: number,
  glowRgba: string,
) {
  const outer = radius * 5 * dpr
  const grad = ctx.createRadialGradient(x, y, 0, x, y, outer)
  grad.addColorStop(0, 'rgba(234, 230, 222, 0.95)')
  grad.addColorStop(0.35, glowRgba)
  grad.addColorStop(1, 'rgba(239, 133, 87, 0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(x, y, outer, 0, Math.PI * 2)
  ctx.fill()
}

/** Draws one static frame for reduced motion mode or low-end devices. */
function renderStaticFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dpr: number,
  stars: StarDustPoint[],
  streaks: StaticCometStreak[],
) {
  ctx.clearRect(0, 0, w * dpr, h * dpr)
  for (const s of stars) {
    const [r, g, b] = s.colorRgb
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${s.baseAlpha})`
    ctx.beginPath()
    ctx.arc(s.x * dpr, s.y * dpr, s.radius * dpr, 0, Math.PI * 2)
    ctx.fill()
  }

  for (const st of streaks) {
    const samples = sampleTrajectoryHistory(st.p0, st.pc, st.p1, st.t, st.tailSpan, 24)
    if (samples.length < 2) continue
    const [tr, tg, tb] = st.color.tailColorRgb

    if (st.color.type === 'great' && st.color.ionTailColorRgb) {
      const [ir, ig, ib] = st.color.ionTailColorRgb
      const tan = computeQuadraticTangent(st.p0, st.pc, st.p1, st.t)
      const tLen = Math.hypot(tan.x, tan.y) || 1
      const hx = samples[0].x * dpr
      const hy = samples[0].y * dpr
      ctx.beginPath()
      ctx.moveTo(hx, hy)
      ctx.lineTo(hx + (-tan.x / tLen) * 180 * dpr, hy + (-tan.y / tLen) * 180 * dpr)
      ctx.strokeStyle = `rgba(${ir}, ${ig}, ${ib}, 0.25)`
      ctx.lineWidth = 1.6 * dpr
      ctx.stroke()
    }

    for (let i = 0; i < samples.length - 1; i++) {
      const pA = samples[i]
      const pB = samples[i + 1]
      const alpha = Math.min(0.72, 0.7 * Math.pow(1 - pA.age, 1.1))
      ctx.beginPath()
      ctx.moveTo(pA.x * dpr, pA.y * dpr)
      ctx.lineTo(pB.x * dpr, pB.y * dpr)
      ctx.strokeStyle = `rgba(${tr}, ${tg}, ${tb}, ${alpha})`
      ctx.lineWidth = Math.max(0.4, st.tailWidth * (1 - pA.age) * dpr)
      ctx.lineCap = 'round'
      ctx.stroke()
    }
    drawHead(ctx, samples[0].x * dpr, samples[0].y * dpr, st.headRadius, dpr, st.color.headGlowRgba)
  }
}

export default function CometSky() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollYRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const staticOnly = prefersReducedMotion() || isLowEndDevice()
    let width = window.innerWidth
    let height = window.innerHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let stars = generateStarDust(80, width, height, 2026)

    const resizeCanvas = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      stars = generateStarDust(80, width, height, 2026)
    }
    resizeCanvas()

    if (staticOnly) {
      renderStaticFrame(ctx, width, height, dpr, stars, createStaticCometStreaks(width, height))
      let resizeTimer: ReturnType<typeof setTimeout> | undefined
      const onResize = () => {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          resizeCanvas()
          renderStaticFrame(ctx, width, height, dpr, stars, createStaticCometStreaks(width, height))
        }, 150)
      }
      window.addEventListener('resize', onResize, { passive: true })
      return () => {
        clearTimeout(resizeTimer)
        window.removeEventListener('resize', onResize)
      }
    }

    const onScroll = () => {
      scrollYRef.current = window.scrollY || window.pageYOffset || 0
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    const comets = createCometPool()
    const sparks = createSparkPool()
    const rand = createSeededRandom((Date.now() & 0xffff) ^ 42)
    let rafId = 0
    let lastFrameTime = 0
    let lastSpawnTime = 0
    let nextSpawnInterval = getNextSpawnInterval(rand)
    let isVisible = true
    let isTabVisible = !document.hidden

    const onVisChange = () => { isTabVisible = !document.hidden }
    document.addEventListener('visibilitychange', onVisChange)

    const obs = new IntersectionObserver(([e]) => { isVisible = e.isIntersecting }, { threshold: 0.05 })
    obs.observe(container)

    let resizeTimer: ReturnType<typeof setTimeout> | undefined
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(resizeCanvas, 150)
    }
    window.addEventListener('resize', onResize, { passive: true })

    const spawnComet = (timestamp: number) => {
      const c = comets.find((item) => !item.alive)
      if (!c) return
      const traj = createCometTrajectory(width, height, rand)
      c.alive = true
      c.p0 = traj.p0
      c.pc = traj.pc
      c.p1 = traj.p1
      c.startTime = timestamp
      c.duration = traj.duration
      c.color = traj.color
      c.headRadius = traj.headRadius
      c.tailWidth = traj.tailWidth
      c.historyCount = 0
      c.nextSparkTime = timestamp + 100
    }

    const emitSpark = (x: number, y: number, colorRgb: RgbTriple) => {
      const sp = sparks.find((item) => !item.alive)
      if (!sp) return
      sp.alive = true
      sp.x = x + (rand() - 0.5) * 6
      sp.y = y + (rand() - 0.5) * 6
      sp.vx = (rand() - 0.5) * 0.8
      sp.vy = (rand() - 0.5) * 0.8
      sp.alpha = 0.4
      sp.decay = 0.02 + rand() * 0.02
      sp.size = 0.8 + rand() * 0.8
      sp.colorRgb = colorRgb
    }

    const tick = (timestamp: number) => {
      if (!isVisible || !isTabVisible) {
        rafId = requestAnimationFrame(tick)
        return
      }
      if (shouldSkipFrame(timestamp, lastFrameTime, 30)) {
        rafId = requestAnimationFrame(tick)
        return
      }
      lastFrameTime = timestamp

      const aliveCount = comets.filter((c) => c.alive).length
      if (canSpawnComet(aliveCount, MAX_COMETS) && isSpawnDue(timestamp, lastSpawnTime, nextSpawnInterval)) {
        spawnComet(timestamp)
        lastSpawnTime = timestamp
        nextSpawnInterval = getNextSpawnInterval(rand)
      }

      ctx.clearRect(0, 0, width * dpr, height * dpr)
      const parallaxY = -scrollYRef.current * 0.04

      // Draw star dust (alpha <= 0.35)
      for (const s of stars) {
        let drawY = (s.y + parallaxY) % height
        if (drawY < 0) drawY += height
        const alpha = getStarAlpha(s.baseAlpha, s.twinkleSpeed, s.phase, timestamp)
        const [r, g, b] = s.colorRgb
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        ctx.beginPath()
        ctx.arc(s.x * dpr, drawY * dpr, s.radius * dpr, 0, Math.PI * 2)
        ctx.fill()
      }

      // Update and draw comets
      for (const c of comets) {
        if (!c.alive) continue
        const progress = (timestamp - c.startTime) / c.duration
        if (progress >= 1) {
          c.alive = false
          continue
        }

        const pt = computeQuadraticPoint(c.p0, c.pc, c.p1, progress)
        const headX = pt.x
        const headY = pt.y + parallaxY

        const curCount = Math.min(c.historyCount + 1, MAX_HISTORY)
        for (let i = curCount - 1; i > 0; i--) {
          c.historyX[i] = c.historyX[i - 1]
          c.historyY[i] = c.historyY[i - 1]
        }
        c.historyX[0] = headX
        c.historyY[0] = headY
        c.historyCount = curCount

        const [tr, tg, tb] = c.color.tailColorRgb

        // Great comet faint blue ion tail
        if (c.color.type === 'great' && c.color.ionTailColorRgb) {
          const [ir, ig, ib] = c.color.ionTailColorRgb
          const tan = computeQuadraticTangent(c.p0, c.pc, c.p1, progress)
          const tLen = Math.hypot(tan.x, tan.y) || 1
          ctx.beginPath()
          ctx.moveTo(headX * dpr, headY * dpr)
          ctx.lineTo((headX - (tan.x / tLen) * 140) * dpr, (headY - (tan.y / tLen) * 140) * dpr)
          ctx.strokeStyle = `rgba(${ir}, ${ig}, ${ib}, 0.22)`
          ctx.lineWidth = 1.4 * dpr
          ctx.stroke()
        }

        // Main tapering curved tail (alpha <= 0.5)
        if (curCount >= 2) {
          for (let i = 0; i < curCount - 1; i++) {
            const age = i / MAX_HISTORY
            const alpha = Math.min(0.72, 0.7 * Math.pow(1 - age, 1.1))
            ctx.beginPath()
            ctx.moveTo(c.historyX[i] * dpr, c.historyY[i] * dpr)
            ctx.lineTo(c.historyX[i + 1] * dpr, c.historyY[i + 1] * dpr)
            ctx.strokeStyle = `rgba(${tr}, ${tg}, ${tb}, ${alpha})`
            ctx.lineWidth = Math.max(0.4, c.tailWidth * (1 - age) * dpr)
            ctx.lineCap = 'round'
            ctx.stroke()
          }
        }

        if (timestamp >= c.nextSparkTime) {
          emitSpark(headX, headY, c.color.tailColorRgb)
          c.nextSparkTime = timestamp + 90 + rand() * 120
        }

        drawHead(ctx, headX * dpr, headY * dpr, c.headRadius, dpr, c.color.headGlowRgba)
      }

      // Update and draw sparks
      for (const sp of sparks) {
        if (!sp.alive) continue
        sp.x += sp.vx
        sp.y += sp.vy
        sp.alpha -= sp.decay
        if (sp.alpha <= 0) {
          sp.alive = false
          continue
        }
        const [sr, sg, sb] = sp.colorRgb
        ctx.fillStyle = `rgba(${sr}, ${sg}, ${sb}, ${sp.alpha})`
        ctx.beginPath()
        ctx.arc(sp.x * dpr, (sp.y + parallaxY) * dpr, sp.size * dpr, 0, Math.PI * 2)
        ctx.fill()
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisChange)
      obs.disconnect()
    }
  }, [])

  return (
    <div ref={containerRef} className="comet-sky-wrap" aria-hidden="true">
      <canvas ref={canvasRef} className="comet-sky-canvas" />
    </div>
  )
}
