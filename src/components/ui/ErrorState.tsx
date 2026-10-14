import { Link } from 'react-router-dom'
import { ApiError, MAX_ATTEMPTS } from '../../lib/api'
import './ui.css'

interface ErrorStateProps {
  error: ApiError
  onRetry?: () => void
  backTo?: { to: string; label: string }
}

const COPY: Record<ApiError['kind'], { title: string; body: string }> = {
  network: {
    title: 'Signal lost',
    body: "We couldn't reach the events server. Check your connection and try again.",
  },
  timeout: {
    title: 'Taking too long',
    body: 'The events server is slow to respond right now. Give it another try in a moment.',
  },
  server: {
    title: 'Server hiccup',
    body: 'The events server returned an error. It is usually back within a minute.',
  },
  not_found: {
    title: 'Event not found',
    body: "This event doesn't exist, or it has been removed from the programme.",
  },
  parse: {
    title: 'Garbled transmission',
    body: 'We received data we could not read. Retrying usually fixes it.',
  },
}

export default function ErrorState({ error, onRetry, backTo }: ErrorStateProps) {
  const copy = COPY[error.kind]
  const canRetry = onRetry && error.kind !== 'not_found'

  return (
    <section className="ui-state" role="alert">
      <svg className="ui-state__icon" width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <circle cx="28" cy="28" r="23" stroke="currentColor" strokeWidth="2" strokeDasharray="4 5" />
        <path d="M28 16v15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="28" cy="39" r="2.2" fill="currentColor" />
      </svg>
      <h2 className="ui-state__title">{copy.title}</h2>
      <p className="ui-state__body">{copy.body}</p>
      {error.retryable && <p className="ui-state__meta">Tried {MAX_ATTEMPTS} times</p>}
      <div className="ui-state__actions">
        {canRetry && (
          <button type="button" className="btn btn--primary" onClick={onRetry}>
            Try again
          </button>
        )}
        {backTo && (
          <Link className="btn btn--ghost" to={backTo.to}>
            {backTo.label}
          </Link>
        )}
      </div>
    </section>
  )
}
