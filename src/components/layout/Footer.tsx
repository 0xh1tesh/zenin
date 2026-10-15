import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useInView } from '../ambient/useInView'
import './layout.css'
import './footer-fx.css'

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null)
  useInView(footerRef)

  return (
    <footer ref={footerRef} className="footer">

      <div className="container footer__inner">
        <div className="footer__cols">
          <div>
            <p className="eyebrow">Zenin &apos;26 · Coimbatore</p>
            <p className="footer__blurb">
              Two months, thirty events, one sky. Hackathons, robotics, AI, dance, theatre and everything in between.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="footer__links">
              <li>
                <Link to="/events">All events</Link>
              </li>
              <li>
                <Link to="/events?open=1&sort=deadline">Closing soon</Link>
              </li>
              <li>
                <Link to="/events?price=free">Free to join</Link>
              </li>
              <li>
                <Link to="/events?type=workshop">Workshops</Link>
              </li>
            </ul>
          </nav>
        </div>
        <p className="footer__credit">
          Built for the Render72 design challenge. Event data from the Render72 API · Photos from Pexels.
        </p>
      </div>

      <div className="footer__satellite-track" aria-hidden="true">
        <span className="footer__satellite">
          <svg viewBox="0 0 24 24" className="footer__satellite-icon" aria-hidden="true">
            <rect x="9" y="9" width="6" height="6" rx="1" fill="var(--sand)" />
            <line x1="2" y1="12" x2="9" y2="12" stroke="var(--coral)" strokeWidth="1.5" />
            <line x1="15" y1="12" x2="22" y2="12" stroke="var(--coral)" strokeWidth="1.5" />
            <rect x="2" y="9.5" width="4" height="5" rx="0.5" fill="var(--blue)" stroke="var(--coral)" strokeWidth="0.8" />
            <rect x="18" y="9.5" width="4" height="5" rx="0.5" fill="var(--blue)" stroke="var(--coral)" strokeWidth="0.8" />
            <circle cx="12" cy="7" r="1.5" fill="var(--coral)" />
          </svg>
          <span className="footer__satellite-beam" />
        </span>
      </div>

      <p className="footer__wordmark" aria-hidden="true">
        ZENIN
      </p>
    </footer>
  )
}
