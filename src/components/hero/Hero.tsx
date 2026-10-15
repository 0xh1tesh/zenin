import { useRef } from 'react'
import { Link } from 'react-router-dom'
import Countdown from '../ui/Countdown'
import Orbits from './Orbits'
import Planet from './Planet'
import Ridge from './Ridge'
import StarField from './StarField'
import ShootingStars from './ShootingStars'
import { useHeroScroll } from './useHeroScroll'
import './hero-scene.css'
import './hero-ui.css'
import './hero-depth.css'
import './hero-moons.css'

export interface HeroStats {
  total: number | null
  open: number | null
  free: number | null
  nextEvent: { name: string; startsAt: string } | null
}

/** Letters are real DOM text from the first render: the h1 is the LCP element and never waits for JS. */
function Letters({ text, offset = 0, accent = false }: { text: string; offset?: number; accent?: boolean }) {
  return (
    <>
      {Array.from(text).map((char, i) => (
        <span
          key={`${offset}-${i}`}
          className={`hero__letter${accent ? ' hero__letter--accent' : ''}`}
          style={{ '--i': offset + i } as React.CSSProperties}
        >
          {char}
        </span>
      ))}
    </>
  )
}

function Stat({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="hero__stat">
      <span className={`hero__stat-value${value === null ? ' hero__stat-value--loading' : ''}`}>{value ?? '—'}</span>
      <span className="hero__stat-label">{label}</span>
    </div>
  )
}

export default function Hero({ stats }: { stats: HeroStats }) {
  const trackRef = useRef<HTMLElement>(null)
  useHeroScroll(trackRef)

  return (
    <section className="hero" ref={trackRef} aria-label="Zenin '26 introduction">
      <div className="hero__stage">
        <StarField />
        <div className="hero__nebula" aria-hidden="true">
          <div className="hero__nebula-blue" />
          <div className="hero__nebula-vermilion" />
        </div>
        <ShootingStars />
        <Planet />
        <Orbits />
        <div className="hero__title" aria-hidden="true">
          <span>ZENIN</span>
        </div>
        <Ridge />
        <div className="hero__fog" aria-hidden="true" />

        <div className="hero__overlay">
          <p className="eyebrow hero__eyebrow">Coimbatore · 26 Sep – 15 Nov 2026</p>
          <h1 className="hero__h1">
            <span className="sr-only">Zenin &apos;26</span>
            <span className="hero__h1-visual" aria-hidden="true">
              <span className="hero__h1-word">
                <Letters text="ZENIN" />
              </span>
              <span className="hero__h1-year">
                <Letters text="'26" offset={5} accent />
              </span>
            </span>
          </h1>
          <p className="hero__tagline">Thirty events. Two months. One sky.</p>
          <div className="hero__ctas">
            <Link to="/events" className="btn btn--primary">
              Explore events
            </Link>
            <Link to="/events?open=1&sort=deadline" className="btn btn--ghost">
              Closing soon
            </Link>
          </div>

          <div className="hero__stats" role="group" aria-label="Festival at a glance">
            <Stat value={stats.total} label="Events" />
            <Stat value={stats.open} label="Open now" />
            <Stat value={stats.free} label="Free" />
          </div>

          {stats.nextEvent && (
            <p className="hero__next">
              <span className="hero__next-label">Next up</span>
              <span className="hero__next-name">{stats.nextEvent.name}</span>
              <Countdown to={stats.nextEvent.startsAt} compact doneLabel="Live now" />
            </p>
          )}

          <div className="hero__scroll-cue" aria-hidden="true">
            <span className="hero__scroll-text">Scroll</span>
            <span className="hero__scroll-line" />
          </div>
        </div>
      </div>
    </section>
  )
}
