import { useRef } from 'react'
import { Link } from 'react-router-dom'
import Caret from '../ambient/Caret'
import Marquee from '../ambient/Marquee'
import ShootingStars from '../ambient/ShootingStars'
import { useInView } from '../ambient/useInView'
import './home.css'

const CTA_TICKER_ITEMS = [
  'REGISTRATIONS OPEN',
  'PUNE COSMIC ARENA',
  '30 EVENTS ACROSS 2 MONTHS',
  'SECURE YOUR TEAM ORBIT',
  'ALL TRANSMISSIONS VERIFIED',
  'MISSION CONTROL ACTIVE',
] as const

export default function CtaBand() {
  const sectionRef = useRef<HTMLElement>(null)
  useInView(sectionRef)

  return (
    <section ref={sectionRef} className="cta-band section" aria-label="Join Zenin '26">
      {/* Tilted reverse ticker band above CTA card */}
      <div className="cta-band__ticker-wrap">
        <Marquee items={CTA_TICKER_ITEMS} reverse tilt speedSec={36} />
      </div>

      <div className="container">
        <div className="cta-band__card">
          <ShootingStars count={2} />
          <div className="cta-band__glow" aria-hidden="true" />
          <div className="cta-band__grid-deco" aria-hidden="true" />

          <div className="cta-band__content">
            {/* Circular rotating text badge spinning around small glowing planet */}
            <div className="cta-band__badge" aria-hidden="true">
              <div className="cta-band__planet">
                <span className="cta-band__planet-core" />
                <span className="cta-band__planet-ring" />
              </div>
              <svg viewBox="0 0 160 160" className="cta-band__badge-svg">
                <defs>
                  <path
                    id="cta-circle-path"
                    d="M 80, 80 m -56, 0 a 56,56 0 1,1 112,0 a 56,56 0 1,1 -112,0"
                  />
                </defs>
                <text className="cta-band__badge-text mono">
                  <textPath href="#cta-circle-path" startOffset="0%">
                    REGISTRATIONS OPEN · ZENIN 26 · FIND YOUR ORBIT ·
                  </textPath>
                </text>
              </svg>
            </div>

            <p className="eyebrow cta-band__eyebrow">
              <span>06 — Mission Departure</span>
              <Caret />
            </p>
            <h2 className="cta-band__title">Find your orbit</h2>
            <p className="cta-band__tagline">
              Thirty competitions, hackathons, and showcases across engineering, arts, and performance.
              Secure your team&apos;s place in Pune&apos;s flagship inter-college festival.
            </p>

            <div className="cta-band__actions">
              <div className="cta-band__btn-wrap">
                <span className="cta-band__btn-halo" aria-hidden="true" />
                <Link to="/events" className="btn btn--primary">
                  Explore all events
                </Link>
              </div>
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
