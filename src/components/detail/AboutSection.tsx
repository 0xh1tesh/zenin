import { type EventDetail } from '../../types'

interface AboutSectionProps {
  event: EventDetail
}

export default function AboutSection({ event }: AboutSectionProps) {
  const paragraphs = event.description
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <section id="about" className="detail-section" aria-labelledby="about-heading">
      <h2 id="about-heading" className="detail-section__heading">
        <span className="detail-section__heading-num">01</span>
        About
      </h2>
      <div className="detail-about__body">
        {paragraphs.map((para, i) => (
          <p key={i} className="detail-about__para">
            {para}
          </p>
        ))}
      </div>

      {event.highlights.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--step--1)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-3)',
              marginBottom: '0.75rem',
            }}
          >
            Highlights
          </h3>
          <ul className="detail-checklist">
            {event.highlights.map((item, i) => (
              <li key={i} className="detail-checklist__item">
                <svg
                  className="detail-checklist__icon detail-checklist__icon--check"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
