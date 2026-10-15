import { memo, type RefObject } from 'react'
import { MAX_PARTICLES_DESKTOP } from './particles'

export interface ParticleTrailProps {
  particleElsRef: RefObject<(HTMLSpanElement | null)[]>
}

/**
 * Pre-allocated pool of particle elements for zero GC DOM particle effects.
 */
function ParticleTrailComponent({ particleElsRef }: ParticleTrailProps) {
  return (
    <div className="rocket-particles" aria-hidden="true">
      {Array.from({ length: MAX_PARTICLES_DESKTOP }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            if (particleElsRef.current) {
              particleElsRef.current[i] = el
            }
          }}
          className="rocket-particle"
        />
      ))}
    </div>
  )
}

export const ParticleTrail = memo(ParticleTrailComponent)
