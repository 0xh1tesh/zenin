import { Link, useParams } from 'react-router-dom'
import ErrorState from '../components/ui/ErrorState'
import Seo from '../components/ui/Seo'
import { RetryNote, Skeleton } from '../components/ui/Skeleton'
import StaleNotice from '../components/ui/StaleNotice'
import { useEvent } from '../lib/useAsync'

/** Phase 0 baseline: the detail worker replaces this with the full ticket layout. */
export default function EventDetail() {
  const { id } = useParams()
  const { state, retry, summary } = useEvent(id)

  return (
    <div className="container section">
      <Link to="/events" className="eyebrow">
        ← All events
      </Link>
      {state.status === 'loading' && (
        <div style={{ marginTop: '1.5rem' }}>
          <RetryNote attempt={state.attempt} />
          <Seo title={summary?.name ?? 'Loading event'} description={summary?.blurb ?? 'Event details'} />
          <h1>{summary?.name ?? <Skeleton style={{ height: '3rem', width: '60%' }} />}</h1>
        </div>
      )}
      {state.status === 'error' && (
        <div style={{ marginTop: '1.5rem' }}>
          <Seo title="Event unavailable" description="This event could not be loaded." noindex />
          <ErrorState error={state.error} onRetry={retry} backTo={{ to: '/events', label: 'Browse all events' }} />
        </div>
      )}
      {state.status === 'success' && (
        <article style={{ marginTop: '1.5rem' }}>
          <Seo title={state.data.name} description={state.data.blurb} image={state.data.banner_image_url} />
          {state.stale && <StaleNotice source={state.source} fetchedAt={state.fetchedAt} onRetry={retry} />}
          <h1>{state.data.name}</h1>
          <p style={{ marginTop: '1rem', color: 'var(--muted)', maxWidth: '60ch' }}>{state.data.blurb}</p>
        </article>
      )}
    </div>
  )
}
