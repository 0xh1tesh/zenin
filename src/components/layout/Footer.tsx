import { Link } from 'react-router-dom'
import './layout.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__cols">
          <div>
            <p className="eyebrow">Zenin &apos;26 · Pune</p>
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
      <p className="footer__wordmark" aria-hidden="true">
        ZENIN
      </p>
    </footer>
  )
}
