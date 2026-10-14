import type { Source } from '../../lib/api'
import { formatStamp } from '../../lib/format'
import './ui.css'

interface StaleNoticeProps {
  source: Source
  fetchedAt: number
  onRetry?: () => void
}

/** Shown whenever we are displaying a cached or snapshot copy instead of live data. */
export default function StaleNotice({ source, fetchedAt, onRetry }: StaleNoticeProps) {
  const label = source === 'snapshot' ? 'Offline snapshot' : 'Saved copy'
  return (
    <div className="ui-stale" role="status">
      <span>
        <strong>{label}</strong> from {formatStamp(fetchedAt)}. We couldn&apos;t reach the live server, so details may be out of date.
      </span>
      {onRetry && (
        <button type="button" className="ui-stale__action" onClick={onRetry}>
          Retry live data
        </button>
      )}
    </div>
  )
}
