import './ui.css'

interface EmptyStateProps {
  title: string
  body?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ title, body, actionLabel, onAction }: EmptyStateProps) {
  return (
    <section className="ui-state" aria-live="polite">
      <svg className="ui-state__icon" width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <circle cx="28" cy="28" r="11" stroke="currentColor" strokeWidth="2" />
        <ellipse cx="28" cy="28" rx="25" ry="8" stroke="currentColor" strokeWidth="2" transform="rotate(-18 28 28)" />
        <circle cx="49" cy="17" r="2.5" fill="currentColor" />
      </svg>
      <h2 className="ui-state__title">{title}</h2>
      {body && <p className="ui-state__body">{body}</p>}
      {actionLabel && onAction && (
        <div className="ui-state__actions">
          <button type="button" className="btn btn--ghost" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      )}
    </section>
  )
}
