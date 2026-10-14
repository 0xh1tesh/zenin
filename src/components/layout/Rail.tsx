import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cx } from '../../lib/cx'
import './layout.css'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  isActive: (pathname: string, search: string) => boolean
}

const svgProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

const HOME = (
  <svg {...svgProps}>
    <path d="M4 11 12 4l8 7" />
    <path d="M6 10v9h12v-9" />
  </svg>
)
const EVENTS = (
  <svg {...svgProps}>
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M4 10h16M9 3v4M15 3v4" />
  </svg>
)
const CLOSING = (
  <svg {...svgProps}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 8v5l3 2M9 2h6" />
  </svg>
)
const WORKSHOPS = (
  <svg {...svgProps}>
    <path d="M13 3 5 14h6l-1 7 8-11h-6z" />
  </svg>
)

const isEvents = (pathname: string) => pathname === '/events' || pathname.startsWith('/events/')

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: HOME, isActive: (p) => p === '/' },
  {
    to: '/events',
    label: 'Events',
    icon: EVENTS,
    isActive: (p, s) => isEvents(p) && !s.includes('open=1') && !s.includes('type=workshop'),
  },
  {
    to: '/events?open=1&sort=deadline',
    label: 'Closing',
    icon: CLOSING,
    isActive: (p, s) => isEvents(p) && s.includes('open=1'),
  },
  {
    to: '/events?type=workshop',
    label: 'Workshops',
    icon: WORKSHOPS,
    isActive: (p, s) => isEvents(p) && s.includes('type=workshop'),
  },
]

/** Floating left icon rail, desktop only (the bottom nav takes over below 1024px). */
export default function Rail() {
  const { pathname, search } = useLocation()
  return (
    <nav className="rail" aria-label="Primary">
      <ul className="rail__list">
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname, search)
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cx('rail__link', active && 'is-active')}
                aria-current={active ? 'page' : undefined}
              >
                {item.icon}
                <span className="rail__label">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
