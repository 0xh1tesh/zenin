import { memo, type RefObject } from 'react'
import './hud.css'

export interface MissionHudProps {
  containerRef: RefObject<HTMLDivElement | null>
  altRef: RefObject<HTMLSpanElement | null>
  sectionRef: RefObject<HTMLDivElement | null>
}

/**
 * Mission HUD: Telemetry tag displayed beside the craft on desktop (>=1024px).
 * - Line 1: 'ALT 400 KM' counting down to 0 KM.
 * - Line 2: Name of the current section (last passed h2, max 22ch).
 * - Hairline border, dark translucent backdrop (rgb(16 16 16 / 0.85)).
 * - Text contrast >= 4.5:1 (sand and bone on void).
 * - Fades out when idle for 1.5s, fades in on scroll.
 * - aria-hidden.
 */
function MissionHudComponent({ containerRef, altRef, sectionRef }: MissionHudProps) {
  return (
    <aside ref={containerRef} className="rocket-hud" aria-hidden="true">
      <div className="rocket-hud__card">
        <div className="rocket-hud__row">
          <span className="rocket-hud__led" />
          <span ref={altRef} className="rocket-hud__alt mono">
            ALT 400 KM
          </span>
        </div>
        <div ref={sectionRef} className="rocket-hud__section mono">
          ORBIT
        </div>
      </div>
    </aside>
  )
}

export const MissionHud = memo(MissionHudComponent)
