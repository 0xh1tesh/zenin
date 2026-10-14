/** STUB — shell worker owns this file. */
import type { ApiError } from '../../lib/api'

interface Props {
  error: ApiError
  onRetry?: () => void
  backTo?: { to: string; label: string }
}

export default function ErrorState({ error, onRetry, backTo }: Props) {
  return (
    <div className="ui-error-state" role="alert" style={{ padding: '3rem', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step-1)', marginBottom: '0.5rem' }}>
        Something went wrong
      </p>
      <p style={{ color: 'var(--ink-2)', marginBottom: '1.5rem' }}>{error.message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} style={{ padding: '0.75rem 1.5rem', background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
          Retry
        </button>
      )}
      {backTo && (
        <a href={backTo.to} style={{ display: 'block', marginTop: '1rem', color: 'var(--ink-2)' }}>{backTo.label}</a>
      )}
    </div>
  )
}
