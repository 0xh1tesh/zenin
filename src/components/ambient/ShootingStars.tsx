import './shooting-stars.css'

export interface ShootingStarsProps {
  count?: number
  className?: string
}

interface StreakConfig {
  id: number
  top: number
  left: number
  delay: number
  duration: number
  angle: number
}

// Deterministic streak definitions with long staggered intervals
const PRESET_STREAKS: readonly StreakConfig[] = [
  { id: 1, top: 12, left: 18, delay: 0, duration: 11, angle: -32 },
  { id: 2, top: 28, left: 62, delay: 4.5, duration: 13, angle: -35 },
  { id: 3, top: 58, left: 10, delay: 8.5, duration: 12, angle: -28 },
  { id: 4, top: 42, left: 75, delay: 2, duration: 14, angle: -30 },
]

export default function ShootingStars({ count = 3, className = '' }: ShootingStarsProps) {
  const activeStreaks = PRESET_STREAKS.slice(0, Math.min(count, PRESET_STREAKS.length))

  return (
    <div className={`shooting-stars-layer ${className}`} aria-hidden="true">
      {activeStreaks.map((streak) => (
        <span
          key={streak.id}
          className="shooting-star-streak"
          style={
            {
              top: `${streak.top}%`,
              left: `${streak.left}%`,
              '--shoot-delay': `${streak.delay}s`,
              '--shoot-duration': `${streak.duration}s`,
              '--shoot-angle': `${streak.angle}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
