import { Link } from 'react-router-dom'
import type { EventSummary } from '../../types'
import { daysUntil } from '../../lib/format'

interface HeroStatsProps {
  events: EventSummary[]
}

function computeStats(events: EventSummary[]) {
  const total = events.length
  const openReg = events.filter(
    (e) => e.registration_status === 'OPEN' && e.event_status === 'ACTIVE',
  ).length
  const freeCount = events.filter((e) => e.price === 0).length

  // Date span
  const dates = events
    .map((e) => e.schedule_summary.start_date)
    .sort()
  const first = dates[0]
  const last = dates[dates.length - 1]

  let dateSpan = '—'
  if (first && last) {
    const fmt = (d: string) => {
      const date = new Date(`${d}T00:00:00+05:30`)
      return date.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
      })
    }
    dateSpan = `${fmt(first)} – ${fmt(last)}`
  }

  // Days until festival start
  const daysLeft = first ? daysUntil(`${first}T00:00:00+05:30`) : null

  return { total, openReg, freeCount, dateSpan, daysLeft }
}

interface StatCellProps {
  value: string | number
  label: string
}

function StatCell({ value, label }: StatCellProps) {
  return (
    <div className="home-stat">
      <span className="home-stat__value">{value}</span>
      <span className="home-stat__label">{label}</span>
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="home-stat">
      <span className="home-stat__value home-stat__value--skel" aria-hidden="true" />
      <span className="home-stat__label">Loading…</span>
    </div>
  )
}

interface HeroProps {
  events: EventSummary[] | null
  stale: boolean
  loading: boolean
  errored: boolean
}

export default function HeroSection({ events, stale, loading, errored }: HeroProps) {
  const stats = events ? computeStats(events) : null

  return (
    <section className="home-hero" aria-label="Festival hero">
      <div className="home-hero__inner">
        {/* Left: headline + CTA — renders instantly, no API */}
        <div>
          <p className="home-hero__eyebrow" aria-hidden="true">
            Pune · 2026
          </p>
          <h1 className="home-hero__title">
            Kaleido&shy;
            <em>scope</em>
            <br />
            '26
          </h1>
          <p className="home-hero__sub">
            Pune's biggest inter-college festival — hackathons, robotics, music,
            theatre, dance &amp; more. One pass. Thirty events.
          </p>
          <Link to="/events" className="home-hero__cta">
            Browse all events
            <span className="home-hero__cta-arrow" aria-hidden="true">→</span>
          </Link>

          <div className="home-hero__meta" role="list">
            <span className="home-hero__meta-item" role="listitem">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1" y="3" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M1 7h14" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              26 Sep – 15 Nov 2026
            </span>
            <span className="home-hero__meta-item" role="listitem">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 1C4.686 1 2 3.686 2 7c0 4 6 8 6 8s6-4 6-8c0-3.314-2.686-6-6-6Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Pune, Maharashtra
            </span>
          </div>

          {stale && (
            <div className="home-hero__stale">
              <span className="home-stale-notice" role="status" aria-live="polite">
                Showing saved data
              </span>
            </div>
          )}
        </div>

        {/* Right: live stats grid */}
        <div>
          <div
            className="home-hero__stats"
            role="region"
            aria-label="Festival at a glance"
            aria-busy={loading}
          >
            {loading || errored ? (
              <>
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </>
            ) : stats ? (
              <>
                <StatCell value={stats.total} label="Events & Workshops" />
                <StatCell value={stats.openReg} label="Open Now" />
                <StatCell value={stats.freeCount} label="Free to Join" />
                <StatCell
                  value={stats.daysLeft !== null && stats.daysLeft > 0 ? `${stats.daysLeft}d` : '—'}
                  label="Days to Fest"
                />
              </>
            ) : null}
          </div>

          {stats && (
            <p className="home-hero__meta-item" style={{ marginTop: '1rem', fontSize: 'var(--step--1)' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1" y="3" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M1 7h14" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {stats.dateSpan}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
