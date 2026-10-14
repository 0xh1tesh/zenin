import type { Prize } from '../../types'
import { formatInr } from '../../lib/format'
import { ordinal } from './helpers'
import './detail-sections.css'
import './detail-prizes.css'

interface PrizesSectionProps {
  prizes: Prize[]
  num?: string
}

const RANK_BADGE: Record<number, string> = {
  1: '01 // 1ST PLACE',
  2: '02 // 2ND PLACE',
  3: '03 // 3RD PLACE',
}

export default function PrizesSection({ prizes, num = '04' }: PrizesSectionProps) {
  if (!prizes || prizes.length === 0) return null

  const podium = prizes.filter((p) => p.rank <= 3).sort((a, b) => a.rank - b.rank)
  const rest = prizes.filter((p) => p.rank > 3).sort((a, b) => a.rank - b.rank)

  return (
    <section id="prizes" className="detail-section" aria-labelledby="prizes-heading">
      <div className="detail-section__header">
        <span className="detail-section__num">{num} //</span>
        <h2 id="prizes-heading" className="detail-section__title">
          Prizes
        </h2>
      </div>
      <div className="detail-section__rule" aria-hidden="true" />

      {podium.length > 0 && (
        <div className="detail-prizes__podium">
          {podium.map((prize) => (
            <article
              key={prize.rank}
              className={`detail-prize-card detail-prize-card--${prize.rank}`}
              aria-label={`${ordinal(prize.rank)} place: ${prize.title}, ${formatInr(prize.amount)}`}
            >
              <div className="detail-prize-card__badge" aria-hidden="true">
                {RANK_BADGE[prize.rank] ?? `RANK ${prize.rank}`}
              </div>
              <div className="detail-prize-card__amount">{formatInr(prize.amount)}</div>
              <div className="detail-prize-card__title">{prize.title}</div>
              {prize.description && (
                <p className="detail-prize-card__desc">{prize.description}</p>
              )}
            </article>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <ul className="detail-prizes__rest" aria-label="Additional prizes">
          {rest.map((prize) => (
            <li key={prize.rank} className="detail-prizes__rest-item">
              <div className="detail-prizes__rest-left">
                <span className="detail-prizes__rest-rank">{ordinal(prize.rank)}</span>
                <span className="detail-prizes__rest-title">{prize.title}</span>
              </div>
              <span className="detail-prizes__rest-amount">{formatInr(prize.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
