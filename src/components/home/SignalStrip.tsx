import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../lib/motion'
import type { EventSummary } from '../../types'
import { daysToNext } from './helpers'
import { registrationState } from '../ui/StatusBadge'
import { Skeleton } from '../ui/Skeleton'
import Marquee from '../ambient/Marquee'
import ShootingStars from '../ambient/ShootingStars'
import Sparkles from '../ambient/Sparkles'
import Caret from '../ambient/Caret'
import { useInView } from '../ambient/useInView'
import './home.css'

export interface SignalStripProps {
  events: EventSummary[] | null
}

interface StatDef {
  value: number | null
  label: string
  suffix?: string
}

const DEFAULT_MARQUEE_ITEMS = [
  '30 EVENTS · 2 MONTHS · 1 SKY',
  'NOW BOARDING',
  'LIVE TELEMETRY ACTIVE',
  'REGISTRATIONS OPEN',
  'COIMBATORE COSMIC ARENA',
  'FIND YOUR ORBIT',
] as const

function useCountUp(target: number | null, active: boolean): number | null {
  const [current, setCurrent] = useState<number | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (target === null) {
      setCurrent(null)
      return
    }
    if (prefersReducedMotion()) {
      setCurrent(target)
      return
    }
    if (!active) return

    const start = Date.now()
    const duration = 1200
    const from = 0

    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(from + (target - from) * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, active])

  return current
}

interface StatCellProps {
  value: number | null
  label: string
  suffix?: string
  index: number
  active: boolean
}

function StatCell({ value, label, suffix, index, active }: StatCellProps) {
  const displayed = useCountUp(value, active)

  return (
    <div className="signal__stat" style={{ '--idx': index } as React.CSSProperties}>
      <span className="signal__num" aria-live="polite" aria-atomic="true">
        {value === null ? (
          <Skeleton className="signal__skel" />
        ) : (
          <>
            {displayed !== null ? displayed : '—'}
            {suffix && displayed !== null && <span className="signal__suffix">{suffix}</span>}
          </>
        )}
      </span>
      <span className="signal__label mono">{label}</span>
    </div>
  )
}

export default function SignalStrip({ events }: SignalStripProps) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  useInView(ref)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const total = events ? events.length : null
  const open = events ? events.filter((e) => registrationState(e).registrable).length : null
  const free = events ? events.filter((e) => e.price === 0).length : null
  const days = daysToNext(events)

  const stats: StatDef[] = [
    { value: total, label: 'Events in programme' },
    { value: open, label: 'Open for entry' },
    { value: free, label: 'Free to join' },
    { value: days, label: 'Days to next event', suffix: 'd' },
  ]

  // Dynamic marquee items including top event names if loaded
  const marqueeItems = events && events.length > 0
    ? [
        '30 EVENTS · 2 MONTHS · 1 SKY',
        'NOW BOARDING',
        ...events.slice(0, 4).map((e) => e.name.toUpperCase()),
        'REGISTRATIONS OPEN',
        'MISSION TRANSMISSION ACTIVE',
      ]
    : DEFAULT_MARQUEE_ITEMS

  return (
    <section ref={ref} className="signal section" aria-label="Programme statistics">
      <ShootingStars count={2} />
      <Sparkles count={14} seed={77} />

      {/* Marquee ticker bridging Hero and SignalStrip */}
      <div className="signal__top-marquee">
        <Marquee items={marqueeItems} speedSec={28} />
      </div>

      <div className="container">
        <div className="signal__header">
          <p className="eyebrow signal__eyebrow">
            <span>01 — Signal</span>
            <Caret />
            <span className="signal__status-live">
              <span className="signal__status-dot" aria-hidden="true" />
              LIVE
            </span>
          </p>
          <h2 className="signal__heading">Telemetry at a glance</h2>
        </div>

        <div className="signal__grid-wrap">
          <div className="signal__scanline" aria-hidden="true" />
          <div className="signal__grid">
            {stats.map((s, i) => (
              <StatCell
                key={s.label}
                value={s.value}
                label={s.label}
                suffix={s.suffix}
                index={i}
                active={visible}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
