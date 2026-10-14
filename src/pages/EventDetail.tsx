import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { peekEvents } from '../lib/api'
import { useEvent, useEvents } from '../lib/useAsync'
import ErrorState from '../components/ui/ErrorState'
import Seo from '../components/ui/Seo'
import StaleNotice from '../components/ui/StaleNotice'
import AboutSection from '../components/detail/AboutSection'
import DetailHero from '../components/detail/DetailHero'
import DetailSkeleton from '../components/detail/DetailSkeleton'
import FaqsSection from '../components/detail/FaqsSection'
import GallerySection from '../components/detail/GallerySection'
import { buildEventJsonLd } from '../components/detail/helpers'
import ListSection from '../components/detail/ListSection'
import MobileActionBar from '../components/detail/MobileActionBar'
import PrizesSection from '../components/detail/PrizesSection'
import RegisterDialog from '../components/detail/RegisterDialog'
import RelatedEvents from '../components/detail/RelatedEvents'
import ScheduleSection from '../components/detail/ScheduleSection'
import SectionNav, { type NavSection } from '../components/detail/SectionNav'
import TeamSection from '../components/detail/TeamSection'
import TicketPanel from '../components/detail/TicketPanel'

export default function EventDetail() {
  const { id } = useParams()
  const { state, retry, summary } = useEvent(id)
  const { state: eventsState } = useEvents()
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  const allEvents = useMemo(() => {
    if (eventsState.status === 'success') return eventsState.data
    return peekEvents()?.data ?? []
  }, [eventsState])

  // Compute navigation sections and numbers dynamically based on populated data
  const navData = useMemo(() => {
    if (state.status !== 'success') return { sections: [], nums: {} as Record<string, string> }
    const event = state.data
    const sections: NavSection[] = []
    const nums: Record<string, string> = {}

    let count = 1
    const register = (secId: string, label: string) => {
      const num = String(count++).padStart(2, '0')
      sections.push({ id: secId, label, num })
      nums[secId] = num
    }

    if (event.description) register('about', 'About')
    if (event.highlights?.length > 0) register('highlights', 'Highlights')
    if (event.what_to_expect?.length > 0) register('what-to-expect', 'Expectations')
    if (event.schedules?.length > 0) register('schedule', 'Schedule')
    if (event.prizes?.length > 0) register('prizes', 'Prizes')
    if (event.rules?.length > 0) register('rules', 'Rules')
    if (event.eligibility?.length > 0) register('eligibility', 'Eligibility')
    if (event.prerequisites?.length > 0) register('prerequisites', 'Prerequisites')
    if (event.faqs?.length > 0) register('faqs', 'FAQs')
    if (event.gallery_images?.length > 0) register('gallery', 'Gallery')
    if (event.organizers?.length > 0 || event.coordinators?.length > 0) {
      register('team', 'Team')
    }

    return { sections, nums }
  }, [state])

  // 1. Error state
  if (state.status === 'error') {
    return (
      <div className="container section">
        <Seo title="Event unavailable" description="This event could not be loaded." noindex />
        <ErrorState
          error={state.error}
          onRetry={state.error.kind !== 'not_found' ? retry : undefined}
          backTo={{ to: '/events', label: 'Browse all events' }}
        />
      </div>
    )
  }

  // 2. Loading state: without cached summary
  if (state.status === 'loading' && !summary) {
    return (
      <div className="page-bleed">
        <Seo title="Loading event" description="Event details" />
        <DetailSkeleton includeHero attempt={state.attempt} />
      </div>
    )
  }

  // 3. Loading state with summary: instant header paint, skeletons for sections
  if (state.status === 'loading' && summary) {
    return (
      <div className="page-bleed">
        <Seo
          title={summary.name}
          description={summary.blurb}
          image={summary.cover_image_url}
        />
        <DetailHero event={summary} />
        <DetailSkeleton includeHero={false} attempt={state.attempt} />
      </div>
    )
  }

  // 4. Success state: full event detail
  if (state.status === 'success') {
    const event = state.data
    const { sections, nums } = navData
    const currentUrl = typeof window !== 'undefined' ? window.location.href : undefined
    const jsonLd = buildEventJsonLd(event, currentUrl)

    return (
      <article className="page-bleed">
        <Seo
          title={event.name}
          description={event.blurb}
          image={event.banner_image_url || event.cover_image_url}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <DetailHero event={event} />

        <SectionNav sections={sections} />

        <div className="container">
          {state.stale && (
            <div style={{ marginTop: '1.5rem' }}>
              <StaleNotice source={state.source} fetchedAt={state.fetchedAt} onRetry={retry} />
            </div>
          )}

          <div className="detail-body">
            <div className="detail-content">
              <AboutSection description={event.description} num={nums['about']} />

              <ListSection
                id="highlights"
                title="Highlights"
                items={event.highlights}
                num={nums['highlights']}
              />

              <ListSection
                id="what-to-expect"
                title="What to Expect"
                items={event.what_to_expect}
                num={nums['what-to-expect']}
              />

              <ScheduleSection schedules={event.schedules} num={nums['schedule']} />

              <PrizesSection prizes={event.prizes} num={nums['prizes']} />

              <ListSection
                id="rules"
                title="Rules & Guidelines"
                items={event.rules}
                num={nums['rules']}
                isOrdered={true}
              />

              <ListSection
                id="eligibility"
                title="Eligibility Criteria"
                items={event.eligibility}
                num={nums['eligibility']}
              />

              <ListSection
                id="prerequisites"
                title="Prerequisites"
                items={event.prerequisites}
                num={nums['prerequisites']}
              />

              <FaqsSection faqs={event.faqs} num={nums['faqs']} />

              <GallerySection
                images={event.gallery_images}
                eventName={event.name}
                num={nums['gallery']}
              />

              <TeamSection
                organizers={event.organizers}
                coordinators={event.coordinators}
                num={nums['team']}
              />

              <RelatedEvents currentEvent={event} allEvents={allEvents} />
            </div>

            <TicketPanel event={event} onOpenRegister={() => setIsRegisterOpen(true)} />
          </div>
        </div>

        <MobileActionBar event={event} onOpenRegister={() => setIsRegisterOpen(true)} />

        <RegisterDialog
          event={event}
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
        />
      </article>
    )
  }

  return null
}
