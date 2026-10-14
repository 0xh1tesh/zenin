import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../lib/motion'
import type { EventSummary } from '../../types'
import { daysToNext } from './helpers'
import { registrationState } from '../ui/StatusBadge'
import { Skeleton } from '../ui/Skeleton'
import './home.css'

export interface SignalStripProps {
  events: EventSummary[] | null
}

interface StatDef {
  value: number | null
  label: string
  suffix?: string
}

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
      // ease-out cubic
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

  return (
    <section ref={ref} className="signal section" aria-label="Programme statistics">
      <div className="container">
        <div className="signal__header">
          <p className="eyebrow signal__eyebrow">01 — Signal</p>
          <h2 className="signal__heading">Telemetry at a glance</h2>
        </div>
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
    </section>
  )
}
