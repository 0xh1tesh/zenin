import EventCard from '../components/EventCard'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Seo from '../components/ui/Seo'
import { EventGridSkeleton, RetryNote } from '../components/ui/Skeleton'
import StaleNotice from '../components/ui/StaleNotice'
import { useEvents } from '../lib/useAsync'

/** Phase 0 baseline: the events worker replaces this with filters, grouping and pagination. */
export default function Events() {
  const { state, retry } = useEvents()

  return (
    <div className="container section">
      <Seo title="All events" description="Browse every Zenith '26 event: hackathons, workshops, performances and more." />
      <h1>All events</h1>
      <div style={{ marginTop: '2rem' }}>
        {state.status === 'loading' && (
          <>
            <RetryNote attempt={state.attempt} />
            <EventGridSkeleton />
          </>
        )}
        {state.status === 'error' && <ErrorState error={state.error} onRetry={retry} />}
        {state.status === 'success' && (
          <>
            {state.stale && <StaleNotice source={state.source} fetchedAt={state.fetchedAt} onRetry={retry} />}
            {state.data.length === 0 ? (
              <EmptyState title="No events right now" body="The programme is empty at the moment. Check back soon." />
            ) : (
              <div className="ecard-grid">
                {state.data.map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} priority={i === 0} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
