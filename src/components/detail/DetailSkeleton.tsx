import type { Attempt } from '../../lib/api'
import { RetryNote, Skeleton } from '../ui/Skeleton'
import './detail-hero.css'
import './detail-sections.css'
import './detail-ticket.css'

interface DetailSkeletonProps {
  includeHero?: boolean
  attempt?: Attempt | null
}

export default function DetailSkeleton({
  includeHero = false,
  attempt = null,
}: DetailSkeletonProps) {
  return (
    <div aria-busy="true" aria-label="Loading event details">
      {includeHero && (
        <div className="detail-hero-skel" aria-hidden="true">
          <div className="detail-hero-skel__content">
            <div className="detail-hero-skel__back" />
            <div className="detail-hero-skel__eyebrow" />
            <div className="detail-hero-skel__title" />
            <div className="detail-hero-skel__sub" />
          </div>
        </div>
      )}

      <div className="container">
        <RetryNote attempt={attempt} />

        <div className="detail-body">
          <div className="detail-content" aria-hidden="true">
            {/* Section 1 skeleton */}
            <div className="detail-skel-section">
              <Skeleton className="detail-skel-line detail-skel-line--head" />
              <Skeleton className="detail-skel-line" style={{ width: '95%' }} />
              <Skeleton className="detail-skel-line" style={{ width: '90%' }} />
              <Skeleton className="detail-skel-line" style={{ width: '82%' }} />
            </div>

            {/* Section 2 skeleton */}
            <div className="detail-skel-section">
              <Skeleton className="detail-skel-line detail-skel-line--head" />
              <Skeleton className="detail-skel-line" style={{ height: '3.5rem', marginBottom: '0.8rem' }} />
              <Skeleton className="detail-skel-line" style={{ height: '3.5rem' }} />
            </div>

            {/* Section 3 skeleton */}
            <div className="detail-skel-section">
              <Skeleton className="detail-skel-line detail-skel-line--head" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Skeleton className="detail-skel-line" style={{ height: '8rem' }} />
                <Skeleton className="detail-skel-line" style={{ height: '8rem' }} />
              </div>
            </div>
          </div>

          <aside className="detail-ticket" aria-hidden="true">
            <Skeleton className="detail-skel-line" style={{ width: '40%', height: '1rem', marginBottom: '1.5rem' }} />
            <Skeleton className="detail-skel-line" style={{ width: '60%', height: '2.5rem', marginBottom: '1.5rem' }} />
            <div className="detail-ticket__perforation" />
            <Skeleton className="detail-skel-line" style={{ height: '1.2rem', marginBottom: '0.75rem' }} />
            <Skeleton className="detail-skel-line" style={{ height: '1.2rem', marginBottom: '0.75rem' }} />
            <Skeleton className="detail-skel-line" style={{ height: '1.2rem', marginBottom: '1.5rem' }} />
            <Skeleton className="detail-skel-line" style={{ height: '3rem', borderRadius: '999px' }} />
          </aside>
        </div>
      </div>
    </div>
  )
}
