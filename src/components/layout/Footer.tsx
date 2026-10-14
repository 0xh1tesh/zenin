import { Link } from 'react-router-dom'

const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="layout-footer" role="contentinfo">
      <div className="container layout-footer__inner">
        <div className="layout-footer__brand">
          <Link to="/" className="layout-footer__logo" aria-label="Kaleidoscope '26 home">
            <span className="layout-footer__logo-k">K</span>
            <span className="layout-footer__logo-rest">aleidoscope '26</span>
          </Link>
          <p className="layout-footer__tagline">Pune's Inter-College Festival</p>
        </div>

        <nav className="layout-footer__nav" aria-label="Footer navigation">
          <ul className="layout-footer__nav-list" role="list">
            <li><Link to="/" className="layout-footer__link">Home</Link></li>
            <li><Link to="/events" className="layout-footer__link">All Events</Link></li>
          </ul>
        </nav>

        <div className="layout-footer__meta">
          <p className="layout-footer__dates">26 Sep – 15 Nov 2026 · Pune</p>
          <p className="layout-footer__copy">
            &copy; {YEAR} Kaleidoscope '26. All rights reserved.
          </p>
        </div>
      </div>

      <div className="layout-footer__rule" aria-hidden="true" />
    </footer>
  )
}
