import { memo } from 'react'
import { CONSTELLATIONS, type ConstellationData, type ConstellationStar } from './deepSky'

/**
 * DeepSkyConstellations: Renders 8 real astronomical constellations
 * (Orion, Cassiopeia, Big Dipper, Cygnus, Scorpius, Lyra, Leo, Crux).
 * Exactly one activates on a staggered ~6s cycle with stroke-dashoffset draw,
 * star brightening, and mono label reveal.
 */
function DeepSkyConstellationsComponent() {
  return (
    <div className="deepsky-constellations-layer" aria-hidden="true">
      {CONSTELLATIONS.map((c: ConstellationData) => {
        const style: React.CSSProperties & Record<string, string | number> = {
          top: c.position.top,
          ...(c.position.left ? { left: c.position.left } : {}),
          ...(c.position.right ? { right: c.position.right } : {}),
          width: `${c.width}px`,
          height: `${c.height}px`,
          '--line-len': c.lineLength,
          '--c-desktop-index': c.desktopIndex,
          '--c-mobile-index': c.mobileIndex,
        }

        return (
          <div
            key={c.id}
            className={`deepsky-constellation deepsky-constellation--${c.id} ${
              c.isMobile ? '' : 'deepsky-constellation--desktop-only'
            }`}
            style={style}
          >
            <svg
              viewBox={c.viewBox}
              width={c.width}
              height={c.height}
              className="deepsky-constellation-svg"
              aria-hidden="true"
            >
              <defs>
                {/* Generous userSpaceOnUse filter to prevent clipping thin lines */}
                <filter
                  id={`deepsky-glow-${c.id}`}
                  filterUnits="userSpaceOnUse"
                  x="-60"
                  y="-60"
                  width="320"
                  height="360"
                >
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Resting faint base lines (stroke-width 0.9px sand) */}
              <path d={c.pathD} className="deepsky-constellation-base-lines" />

              {/* Active draw-in lines with stroke-dashoffset animation */}
              <path
                d={c.pathD}
                className="deepsky-constellation-active-lines"
                style={{
                  strokeDasharray: c.lineLength,
                }}
              />

              {/* Constellation Stars */}
              {c.stars.map((star: ConstellationStar) => (
                <g key={star.id} className="deepsky-constellation-star-group">
                  {star.isPrimary && (
                    <circle
                      cx={star.x}
                      cy={star.y}
                      r={star.r * 2.2}
                      fill={star.color ?? 'var(--sand)'}
                      className="deepsky-constellation-star-halo"
                      filter={`url(#deepsky-glow-${c.id})`}
                    />
                  )}
                  <circle
                    cx={star.x}
                    cy={star.y}
                    r={star.r}
                    fill={star.color ?? 'var(--sand)'}
                    className="deepsky-constellation-star-core"
                  />
                </g>
              ))}
            </svg>

            {/* Mono label fades in during constellation active window */}
            <span className="deepsky-constellation-label mono" aria-hidden="true">
              {c.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export const DeepSkyConstellations = memo(DeepSkyConstellationsComponent)
