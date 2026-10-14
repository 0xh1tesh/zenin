import { Link } from 'react-router-dom'
import EventCard from '../components/EventCard'
import ErrorState from '../components/ui/ErrorState'
import Seo from '../components/ui/Seo'
import { EventGridSkeleton, RetryNote } from '../components/ui/Skeleton'
import { useEvents } from '../lib/useAsync'

/** Phase 0 baseline: the hero and landing workers replace this with the cosmic experience. */
export default function Home() {
  const { state, retry } = useEvents()
  const featured = state.status === 'success' ? state.data.filter((e) => e.is_featured).slice(0, 6) : []

  return (
    <div className="container section">
      <Seo
        title="Zenith '26 — Pune's inter-college fest"
        description="Thirty hackathons, workshops, performances and contests across two months. Find your event and register."
      />
      <p className="eyebrow">Pune · Sep – Nov 2026</p>
      <h1 style={{ fontSize: 'var(--step-5)', marginTop: '1rem' }}>ZENITH &apos;26</h1>
      <p style={{ maxWidth: '40ch', margin: '1.5rem 0 2rem', color: 'var(--muted)' }}>
        Thirty events. Two months. One sky.
      </p>
      <Link className="btn btn--primary" to="/events">
        Explore events
      </Link>

      <h2 style={{ margin: '4rem 0 1.5rem', fontSize: 'var(--step-2)' }}>Featured</h2>
      {state.status === 'loading' && (
        <>
          <RetryNote attempt={state.attempt} />
          <EventGridSkeleton count={3} />
        </>
      )}
      {state.status === 'error' && <ErrorState error={state.error} onRetry={retry} />}
      {state.status === 'success' && (
        <div className="ecard-grid">
          {featured.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
