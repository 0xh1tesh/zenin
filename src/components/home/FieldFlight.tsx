import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { afterFirstInteraction, loadGsap, useReducedMotion } from '../../lib/motion'
import { responsiveImage } from '../../lib/image'
import { formatDate } from '../../lib/format'
import type { EventSummary } from '../../types'
import EventCard from '../EventCard'
import { Skeleton } from '../ui/Skeleton'
import Caret from '../ambient/Caret'
import './home.css'

export interface FieldFlightProps {
  events: EventSummary[] | null
}

interface StagedCoverProps {
  event: EventSummary
  index: number
}

function StagedCover({ event, index }: StagedCoverProps) {
  const image = responsiveImage(event.cover_image_url, {
    widths: [640, 960, 1280],
    ratio: 3 / 2,
    sizes: '(min-width: 1024px) 60vw, 100vw',
  })

  return (
    <div className="field__slide" data-index={index} aria-hidden={index !== 0}>
      <Link
        className="field__slide-link"
        to={`/events/${event.id}`}
        tabIndex={index !== 0 ? -1 : undefined}
        aria-label={`View featured event: ${event.name}`}
      >
        <div className="field__img-wrap">
          {image ? (
            <img
              src={image.src}
              srcSet={image.srcSet}
              sizes={image.sizes}
              width={image.width}
              height={image.height}
              alt={event.cover_image_alt}
              loading="lazy"
              decoding="async"
              className="field__img"
            />
          ) : (
            <div className="field__img-placeholder" aria-hidden="true" />
          )}
          <div className="field__overlay" aria-hidden="true" />
        </div>
        <div className="field__info">
          <p className="field__cat eyebrow">{event.category}</p>
          <h3 className="field__title">{event.name}</h3>
          <p className="field__date mono">{formatDate(event.schedule_summary.start_date)}</p>
        </div>
      </Link>
    </div>
  )
}

/** Desktop: 3D pinned stage scrubbed by scroll. Mobile: horizontal scroll-snap rail. */
export default function FieldFlight({ events }: FieldFlightProps) {
  const reducedMotion = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false,
  )

  // Track viewport size for render decision
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    setIsDesktop(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // GSAP ScrollTrigger for the 3D fly-through on desktop (after idle)
  useEffect(() => {
    if (!isDesktop || reducedMotion) return
    const stage = stageRef.current
    if (!stage) return

    let cleanup: (() => void) | undefined
    // Cleanup can run before the async init resolves (StrictMode, fast layout flips): never build a late timeline.
    let cancelled = false

    const init = () => {
      loadGsap().then(({ gsap }) => {
        if (cancelled) return
        const slides = Array.from(stage.querySelectorAll<HTMLElement>('.field__slide'))
        if (slides.length === 0) return

        const ctx = gsap.context(() => {
          gsap.set(slides, { transformPerspective: 1200 })

          // Each slide starts deep (positive z = away from viewer in CSS 3D)
          gsap.set(slides, (i: number) => ({
            z: i === 0 ? 0 : 900 + i * 300,
            opacity: i === 0 ? 1 : 0,
            scale: i === 0 ? 1 : 0.72,
          }))

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: stage,
              start: 'top top',
              end: `+=${slides.length * 120}%`,
              scrub: 1.2,
              pin: true,
              anticipatePin: 1,
            },
          })

          slides.forEach((slide, i) => {
            if (i === 0) return
            const prev = slides[i - 1]
            tl.to(prev, { z: -600, opacity: 0, scale: 0.82, duration: 1 }, i - 1)
            tl.to(slide, { z: 0, opacity: 1, scale: 1, duration: 1 }, i - 1)
            // expose tab access for the visible slide
            tl.call(() => {
              slides.forEach((s, j) => s.setAttribute('aria-hidden', String(j !== i)))
            }, [], i - 0.5)
          })
        }, stage)

        cleanup = () => ctx.revert()
      })
    }

    // The first slide is already shown by CSS; the 3D scrub is only needed once the visitor scrolls.
    const cancelWait = afterFirstInteraction(init)

    return () => {
      cancelled = true
      cancelWait()
      cleanup?.()
    }
  }, [isDesktop, reducedMotion, events])

  if (!events) {
    return (
      <section className="field section" aria-label="Featured events loading">
        <div className="container">
          <div className="field__header">
            <p className="eyebrow field__eyebrow">
              <span>02 — Through the field</span>
              <Caret />
            </p>
            <h2 className="field__heading">Selected trajectory</h2>
          </div>
          <div className="field__rail" role="status" aria-label="Loading featured events">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="field__rail-item">
                <Skeleton className="field__skel" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const featured = events.filter((e) => e.is_featured).slice(0, 6)

  if (featured.length === 0) return null

  const useStage = isDesktop && !reducedMotion

  return (
    <section className="field section" aria-label="Featured events">
      <div className={useStage ? 'field__header-stage' : 'container'}>
        <div className="field__header">
          <p className={`eyebrow field__eyebrow${useStage ? ' field__eyebrow--stage' : ''}`}>
            <span>02 — Through the field</span>
            <Caret />
          </p>
          <h2 className="field__heading">Selected trajectory</h2>
        </div>
      </div>

      {useStage ? (
        /* 3D fly-through stage — full bleed, perspective set on stage wrapper */
        <div className="field__stage" ref={stageRef} aria-label="Featured events scroll stage">
          <div className="field__scene">
            {featured.map((e, i) => (
              <StagedCover key={e.id} event={e} index={i} />
            ))}
          </div>
        </div>
      ) : (
        /* Mobile / reduced-motion: horizontal snap rail of EventCard feature cards */
        <div className="container">
          <div className="field__rail" role="list">
            {featured.map((e, i) => (
              <div key={e.id} className="field__rail-item" role="listitem">
                <EventCard event={e} variant="feature" index={i} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
