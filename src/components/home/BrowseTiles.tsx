import { useRef } from 'react'
import { Link } from 'react-router-dom'
import type { EventSummary } from '../../types'
import { computeBrowseCounts, type BrowseCounts } from './helpers'
import { Skeleton } from '../ui/Skeleton'
import Caret from '../ambient/Caret'
import TileConstellation from '../ambient/TileConstellation'
import { useInView } from '../ambient/useInView'
import './home.css'

export interface BrowseTilesProps {
  events: EventSummary[] | null
}

interface TileDef {
  key: string
  title: string
  query: string
  code: string
  tagline: string
  countKey: keyof BrowseCounts
}

const TILES: readonly TileDef[] = [
  {
    key: 'technical',
    title: 'Technical',
    query: '?kind=technical',
    code: 'SEC-01 / TECH',
    tagline: 'Hackathons, algorithmic sprints, robotics arenas, and AI challenges.',
    countKey: 'technical',
  },
  {
    key: 'cultural',
    title: 'Cultural',
    query: '?kind=cultural',
    code: 'SEC-02 / CULT',
    tagline: 'Live bands, street dance battles, theatre, poetry, and classical arts.',
    countKey: 'cultural',
  },
  {
    key: 'workshops',
    title: 'Workshops',
    query: '?type=workshop',
    code: 'SEC-03 / LABS',
    tagline: 'Hands-on masterclasses in RAG systems, darkroom crafts, and hardware.',
    countKey: 'workshops',
  },
  {
    key: 'online',
    title: 'Online',
    query: '?mode=online',
    code: 'SEC-04 / VIRT',
    tagline: 'Compete remotely from any campus across India with live telemetry.',
    countKey: 'online',
  },
  {
    key: 'free',
    title: 'Free entry',
    query: '?price=free',
    code: 'SEC-05 / ZERO',
    tagline: 'Zero admission fee. Open to all students with valid college ID.',
    countKey: 'free',
  },
] as const

export default function BrowseTiles({ events }: BrowseTilesProps) {
  const sectionRef = useRef<HTMLElement>(null)
  useInView(sectionRef)
  const counts = computeBrowseCounts(events)

  return (
    <section
      ref={sectionRef}
      className="browse section"
      aria-label="Browse events by category and format"
    >

      <div className="container">
        <div className="browse__header">
          <p className="eyebrow browse__eyebrow">
            <span>04 — Browse the sky</span>
            <Caret />
          </p>
          <h2 className="browse__heading">Sectors &amp; disciplines</h2>
          <p className="browse__subhead">
            Navigate through thirty festival initiatives by discipline, competition arena, or format.
          </p>
        </div>

        <div className="browse__grid" role="list">
          {TILES.map((tile) => {
            const count = counts[tile.countKey]
            return (
              <div
                key={tile.key}
                className={`browse__col browse__col--${tile.key}`}
                role="listitem"
              >
                <Link
                  to={`/events${tile.query}`}
                  className={`browse-tile browse-tile--${tile.key}`}
                  aria-label={`Browse ${tile.title}: ${count ?? 'loading'} events available`}
                >
                  {/* Rotating conic border glow */}
                  <div className="browse-tile__glow-wrap" aria-hidden="true">
                    <div className="browse-tile__conic-beam" />
                  </div>
                  <div className="browse-tile__backdrop" aria-hidden="true" />

                  {/* Corner constellation */}
                  <TileConstellation categoryKey={tile.key} />

                  <div className="browse-tile__content">
                    <div className="browse-tile__header">
                      <span className="browse-tile__code mono">{tile.code}</span>
                      <span className="browse-tile__count mono" aria-live="polite">
                        {count === null ? (
                          <Skeleton className="browse-tile__skel" />
                        ) : (
                          `${count} ${count === 1 ? 'event' : 'events'}`
                        )}
                      </span>
                    </div>

                    <div className="browse-tile__body">
                      <h3 className="browse-tile__title">{tile.title}</h3>
                      <p className="browse-tile__tagline">{tile.tagline}</p>
                    </div>

                    <div className="browse-tile__footer">
                      <span className="browse-tile__cta mono">
                        Explore sector <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
