import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cx } from '../../lib/cx'
import MotionToggle from './MotionToggle'
import './layout.css'

function BrandMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="8" fill="var(--vermilion)" />
      <ellipse cx="16" cy="16" rx="14" ry="4.5" stroke="var(--sand)" strokeWidth="1.6" transform="rotate(-20 16 16)" />
    </svg>
  )
}

const LINKS = [
  { to: '/events', label: 'Events' },
  { to: '/events?open=1&sort=deadline', label: 'Closing soon' },
  { to: '/events?type=workshop', label: 'Workshops' },
]

export default function TopBar() {
  const { pathname } = useLocation()
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const update = () => setSolid(window.scrollY > 24)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [pathname])

  return (
    <header className={cx('topbar', solid && 'is-solid')}>
      <Link to="/" className="topbar__brand" aria-label="Zenin '26, home">
        <BrandMark />
        <span className="topbar__name">ZENIN</span>
        <span className="topbar__year">&apos;26</span>
      </Link>
      <nav className="topbar__nav" aria-label="Quick links">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="topbar__link">
            {l.label}
          </Link>
        ))}
      </nav>
      <MotionToggle />
      <Link to="/events" className="btn btn--primary topbar__cta">
        <span className="topbar__cta-long">Explore events</span>
        <span className="topbar__cta-short">Events</span>
      </Link>
    </header>
  )
}
