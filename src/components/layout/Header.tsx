import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/events', label: 'Events' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        toggleRef.current &&
        !toggleRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [menuOpen])

  return (
    <header className="layout-header" role="banner">
      <div className="container layout-header__inner">
        {/* Logo wordmark */}
        <Link to="/" className="layout-header__logo" aria-label="Kaleidoscope '26 — home">
          <span className="layout-header__logo-k" aria-hidden="true">K</span>
          <span className="layout-header__logo-word">aleidoscope</span>
          <span className="layout-header__logo-year">'26</span>
        </Link>

        {/* Desktop nav */}
        <nav className="layout-header__nav" aria-label="Main navigation">
          <ul className="layout-header__nav-list" role="list">
            {NAV_LINKS.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `layout-header__nav-link${isActive ? ' layout-header__nav-link--active' : ''}`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* CTA */}
        <Link to="/events" className="layout-header__cta" aria-label="Register for events">
          Register
        </Link>

        {/* Mobile toggle */}
        <button
          ref={toggleRef}
          type="button"
          className="layout-header__toggle"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="layout-header__toggle-bar" />
          <span className="layout-header__toggle-bar" />
          <span className="layout-header__toggle-bar" />
        </button>
      </div>

      {/* Mobile nav drawer */}
      <div
        id="mobile-nav"
        ref={menuRef}
        className={`layout-header__mobile${menuOpen ? ' layout-header__mobile--open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Mobile navigation">
          <ul className="layout-header__mobile-list" role="list">
            {NAV_LINKS.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  tabIndex={menuOpen ? 0 : -1}
                  className={({ isActive }) =>
                    `layout-header__mobile-link${isActive ? ' layout-header__mobile-link--active' : ''}`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
            <li>
              <Link
                to="/events"
                tabIndex={menuOpen ? 0 : -1}
                className="layout-header__mobile-cta"
              >
                Register Now
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
