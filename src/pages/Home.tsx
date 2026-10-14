import { useEvents } from '../lib/useAsync'
import Hero, { type HeroStats } from '../components/hero/Hero'
import Seo from '../components/ui/Seo'
import StaleNotice from '../components/ui/StaleNotice'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import { RetryNote } from '../components/ui/Skeleton'
import SignalStrip from '../components/home/SignalStrip'
import FieldFlight from '../components/home/FieldFlight'
import ClosingSoon from '../components/home/ClosingSoon'
import BrowseTiles from '../components/home/BrowseTiles'
import Programme from '../components/home/Programme'
import CtaBand from '../components/home/CtaBand'
import { computeHeroStats } from '../components/home/helpers'
import '../components/home/home.css'

export default function Home() {
  const { state, retry } = useEvents()

  const events = state.status === 'success' ? state.data : null
  const heroStats: HeroStats = computeHeroStats(events)

  return (
    <div className="page-bleed">
      <Seo
        title="Zenith '26 — Pune's Inter-College Cosmic Fest"
        description="Thirty hackathons, workshops, performances and competitions across two months. Explore Pune's flagship cosmic festival and register now."
      />

      <Hero stats={heroStats} />

      {state.status === 'loading' && (
        <div className="container">
          <RetryNote attempt={state.attempt} />
        </div>
      )}

      {state.status === 'success' && state.stale && (
        <div className="container home-stale-wrap">
          <StaleNotice source={state.source} fetchedAt={state.fetchedAt} onRetry={retry} />
        </div>
      )}

      {state.status === 'error' ? (
        <div className="container section">
          <ErrorState error={state.error} onRetry={retry} />
        </div>
      ) : state.status === 'success' && events && events.length === 0 ? (
        <div className="container section">
          <EmptyState
            title="No events found in programme"
            body="Transmissions have not arrived from mission control yet. Check back shortly."
            actionLabel="Retry connection"
            onAction={retry}
          />
        </div>
      ) : (
        <>
          <SignalStrip events={events} />
          <FieldFlight events={events} />
          <ClosingSoon events={events} />
          <BrowseTiles events={events} />
          <Programme events={events} />
          <CtaBand />
        </>
      )}
    </div>
  )
}
