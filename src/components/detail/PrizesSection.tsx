import { type EventDetail } from '../../types'
import { formatInr } from '../../lib/format'

interface PrizesSectionProps {
  event: EventDetail
}

const RANK_CLASS: Record<number, string> = {
  1: 'detail-prize-card--gold',
  2: 'detail-prize-card--silver',
  3: 'detail-prize-card--bronze',
}

const RANK_LABEL: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
}

const ORDINAL: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
}

function ordinal(n: number): string {
  if (n in ORDINAL) return ORDINAL[n]
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

export default function PrizesSection({ event }: PrizesSectionProps) {
  if (!event.prizes || event.prizes.length === 0) return null

  const podium = event.prizes.filter((p) => p.rank <= 3)
  const rest = event.prizes.filter((p) => p.rank > 3)

  return (
    <section id="prizes" className="detail-section" aria-labelledby="prizes-heading">
      <h2 id="prizes-heading" className="detail-section__heading">
        <span className="detail-section__heading-num">03</span>
        Prizes
      </h2>

      {podium.length > 0 && (
        <div className="detail-prizes__podium">
          {podium.map((prize) => (
            <article
              key={prize.rank}
              className={`detail-prize-card ${RANK_CLASS[prize.rank] ?? ''}`}
              aria-label={`${ordinal(prize.rank)} place: ${prize.title}, ${formatInr(prize.amount)}`}
            >
              <div className="detail-prize-card__rank" aria-hidden="true">
                {RANK_LABEL[prize.rank] ?? prize.rank}
              </div>
              <div className="detail-prize-card__title">{prize.title}</div>
              <div className="detail-prize-card__amount">{formatInr(prize.amount)}</div>
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
              <span className="detail-prizes__rest-rank">{ordinal(prize.rank)}</span>
              <span className="detail-prizes__rest-title">{prize.title}</span>
              <span className="detail-prizes__rest-amount">{formatInr(prize.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
