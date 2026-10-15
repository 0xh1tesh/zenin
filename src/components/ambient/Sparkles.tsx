import { useMemo } from 'react'
import { generateSparkles } from './ambientHelpers'
import './sparkles.css'

export interface SparklesProps {
  count?: number
  seed?: number
  className?: string
}

export default function Sparkles({ count = 18, seed = 42, className = '' }: SparklesProps) {
  // Deterministic generation computed once per props
  const sparkles = useMemo(() => generateSparkles(count, seed), [count, seed])

  return (
    <div className={`sparkles-layer ${className}`} aria-hidden="true">
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="sparkle-item"
          style={
            {
              top: `${s.y}%`,
              left: `${s.x}%`,
              '--sparkle-size': `${s.size}px`,
              '--sparkle-delay': `${s.delay}s`,
              '--sparkle-duration': `${s.duration}s`,
              '--sparkle-opacity': s.opacity,
            } as React.CSSProperties
          }
        >
          {s.isGlint ? (
            <span className="sparkle-glint">
              <svg viewBox="0 0 10 10" aria-hidden="true">
                <path d="M 5 0 Q 5 5 0 5 Q 5 5 5 10 Q 5 5 10 5 Q 5 5 5 0 Z" />
              </svg>
            </span>
          ) : (
            <span className="sparkle-dot" />
          )}
        </span>
      ))}
    </div>
  )
}
