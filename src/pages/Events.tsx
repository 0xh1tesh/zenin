import { useMemo, useState } from 'react'
import EventFilters from '../components/events/EventFilters'
import EventResults from '../components/events/EventResults'
import { applyFilters, getActiveChips, useEventFilters } from '../components/events/useEventFilters'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Seo from '../components/ui/Seo'
import { EventGridSkeleton, RetryNote } from '../components/ui/Skeleton'
import StaleNotice from '../components/ui/StaleNotice'
import { useEvents } from '../lib/useAsync'
import '../components/events/events.css'

export default function Events() {
  const { state, retry } = useEvents()
  const { filters, setFilter, clearAll } = useEventFilters()
  const [sheetOpen, setSheetOpen] = useState(false)

  const all = state.status === 'success' ? state.data : null
  const filtered = useMemo(() => (all ? applyFilters(all, filters) : []), [all, filters])
  const chips = useMemo(() => getActiveChips(filters), [filters])
  // "x of y" compares against what is visible by default (archive hidden unless asked for).
  const baseCount = useMemo(
    () => (all ? all.filter((e) => filters.past || e.event_status === 'ACTIVE').length : 0),
    [all, filters.past],
  )
  const resetKey = [filters.q, filters.kind, filters.type, filters.mode, filters.price, filters.open, filters.past, filters.sort].join('|')

  const label = chips.map((c) => c.label.replaceAll('"', '')).join(', ')
  const title = chips.length > 0 ? `Events: ${label}` : 'All events'

  return (
    <>
      <Seo
        title={title}
        description="Browse every Zenin '26 event. Filter by technical or cultural, workshop or event, online or on campus, price and open registration."
      />
      <div className="container events-page__header">
        <p className="eyebrow">The programme · 26 Sep to 15 Nov</p>
        <h1 className="events-page__title">
          Every event, <em>in orbit</em>
        </h1>
        <p className="events-page__lede">
          Search the whole programme, filter by what you like, and sort by what&apos;s closing soon.
        </p>
      </div>

      {state.status === 'success' ? (
        <EventFilters
          filters={filters}
          resultCount={filtered.length}
          totalCount={baseCount}
          onFilter={setFilter}
          onClearAll={clearAll}
          activeChips={chips}
          mobileOpen={sheetOpen}
          onMobileOpen={() => setSheetOpen(true)}
          onMobileClose={() => setSheetOpen(false)}
        />
      ) : (
        <div className="events-filter-skel" aria-hidden="true" />
      )}

      <div className="container events-results-wrap">
        {state.status === 'loading' && (
          <div className="events-results">
            <RetryNote attempt={state.attempt} />
            <EventGridSkeleton count={9} />
          </div>
        )}

        {state.status === 'error' && (
          <div className="events-results">
            <ErrorState error={state.error} onRetry={retry} />
          </div>
        )}

        {state.status === 'success' && (
          <>
            {state.stale && <StaleNotice source={state.source} fetchedAt={state.fetchedAt} onRetry={retry} />}
            {all && all.length === 0 && (
              <EmptyState title="No events yet" body="The programme is empty right now. Check back soon." />
            )}
            {all && all.length > 0 && filtered.length === 0 && (
              <EmptyState
                title="Nothing matches those filters"
                body="Try removing a filter or searching for something broader."
                actionLabel="Clear filters"
                onAction={clearAll}
              />
            )}
            {filtered.length > 0 && (
              <EventResults events={filtered} view={filters.view} sort={filters.sort} resetKey={resetKey} />
            )}
          </>
        )}
      </div>
    </>
  )
}
