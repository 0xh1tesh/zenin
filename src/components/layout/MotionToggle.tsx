import { setMotionPaused, useMotionPaused } from '../../lib/motion'

/**
 * Lets the visitor stop every ambient animation (sky, comets, ticker, rocket flight) and remembers the choice.
 * Moving content that starts on its own needs a pause control (WCAG 2.2.2); OS reduced-motion is honoured separately.
 */
export default function MotionToggle() {
  const paused = useMotionPaused()
  const label = paused ? 'Play animations' : 'Pause animations'

  return (
    <button
      type="button"
      className="motion-toggle"
      aria-pressed={paused}
      aria-label="Pause animations"
      title={label}
      onClick={() => setMotionPaused(!paused)}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        {paused ? (
          <path d="M5 3.5v9l7.5-4.5z" fill="currentColor" />
        ) : (
          <>
            <rect x="4" y="3.5" width="2.6" height="9" rx="0.8" fill="currentColor" />
            <rect x="9.4" y="3.5" width="2.6" height="9" rx="0.8" fill="currentColor" />
          </>
        )}
      </svg>
    </button>
  )
}
