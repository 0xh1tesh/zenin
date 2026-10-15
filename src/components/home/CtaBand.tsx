import { Link } from 'react-router-dom'
import './home.css'

export default function CtaBand() {
  return (
    <section className="cta-band section" aria-label="Join Zenin '26">
      <div className="container">
        <div className="cta-band__card">
          <div className="cta-band__glow" aria-hidden="true" />
          <div className="cta-band__grid-deco" aria-hidden="true" />

          <div className="cta-band__content">
            <p className="eyebrow cta-band__eyebrow">06 — Mission Departure</p>
            <h2 className="cta-band__title">Find your orbit</h2>
            <p className="cta-band__tagline">
              Thirty competitions, hackathons, and showcases across engineering, arts, and performance.
              Secure your team&apos;s place in Pune&apos;s flagship inter-college festival.
            </p>

            <div className="cta-band__actions">
              <Link to="/events" className="btn btn--primary">
                Explore all events
              </Link>
              <Link to="/events?open=1&sort=deadline" className="btn btn--ghost">
                Closing soon
              </Link>
            </div>

            <div className="cta-band__telemetry mono">
              <span>PUNE · 18.5204° N, 73.8567° E</span>
              <span className="cta-band__dot" aria-hidden="true">
                ·
              </span>
              <span>26 SEP – 15 NOV 2026</span>
              <span className="cta-band__dot" aria-hidden="true">
                ·
              </span>
              <span>LIVE TRANSMISSION ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
