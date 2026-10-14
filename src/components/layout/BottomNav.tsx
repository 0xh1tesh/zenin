import { Link, useLocation } from 'react-router-dom'
import { cx } from '../../lib/cx'
import { NAV_ITEMS } from './Rail'
import './layout.css'

/** Thumb-reach navigation for phones and tablets (hidden at 1024px and up). */
export default function BottomNav() {
  const { pathname, search } = useLocation()
  return (
    <nav className="bottomnav" aria-label="Primary mobile">
      <ul className="bottomnav__list">
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname, search)
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cx('bottomnav__link', active && 'is-active')}
                aria-current={active ? 'page' : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
