import type { Coordinator, Organizer } from '../../types'
import './detail-sections.css'

interface TeamSectionProps {
  organizers: Organizer[]
  coordinators: Coordinator[]
  num?: string
}

export default function TeamSection({
  organizers,
  coordinators,
  num = '07',
}: TeamSectionProps) {
  const hasOrgs = organizers && organizers.length > 0
  const hasCoords = coordinators && coordinators.length > 0

  if (!hasOrgs && !hasCoords) return null

  return (
    <section id="team" className="detail-section" aria-labelledby="team-heading">
      <div className="detail-section__header">
        <span className="detail-section__num">{num} //</span>
        <h2 id="team-heading" className="detail-section__title">
          Organisers & Coordinators
        </h2>
      </div>
      <div className="detail-section__rule" aria-hidden="true" />

      {hasCoords && (
        <div className="detail-team__grid" aria-label="Student coordinators">
          {coordinators.map((coord) => {
            const isEmail = coord.contact.includes('@')
            const href = isEmail ? `mailto:${coord.contact}` : `tel:${coord.contact}`

            return (
              <div key={coord.id} className="detail-team-card">
                <span className="detail-team-card__role">{coord.role}</span>
                <span className="detail-team-card__name">{coord.name}</span>
                <a
                  href={href}
                  className="detail-team-card__contact"
                  aria-label={`Contact ${coord.name} at ${coord.contact}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    {isEmail ? (
                      <>
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </>
                    ) : (
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    )}
                  </svg>
                  <span>{coord.contact}</span>
                </a>
              </div>
            )
          })}
        </div>
      )}

      {hasOrgs && (
        <div className="detail-team__grid" aria-label="Organizing clubs">
          {organizers.map((org) => (
            <div key={org.id} className="detail-team-card">
              <span className="detail-team-card__role">{org.org_type || 'Organizing Body'}</span>
              <span className="detail-team-card__name">{org.name}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
