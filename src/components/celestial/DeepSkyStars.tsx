import { memo, useMemo } from 'react'
import { generateStars, type StarData } from './deepSkyMath'

interface DeepSkyStarsProps {
  seed?: number
  count?: number
}

/**
 * DeepSkyStars: Renders deterministic background field stars with
 * mixed twinkle behaviors (sine wave twinkle, staccato double-blink,
 * subtle color shifts, and diffraction glints).
 */
function DeepSkyStarsComponent({ seed = 2026, count = 80 }: DeepSkyStarsProps) {
  const stars = useMemo(() => generateStars(count, seed), [count, seed])

  return (
    <div className="deepsky-stars-layer" aria-hidden="true">
      {stars.map((star: StarData) => (
        <span
          key={star.id}
          className={`deepsky-star deepsky-star--${star.behavior} ${
            star.isMobile ? '' : 'deepsky-star--desktop-only'
          }`}
          style={
            {
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              color: star.color,
              '--star-delay': `${star.delay}s`,
              '--star-dur': `${star.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

export const DeepSkyStars = memo(DeepSkyStarsComponent)
