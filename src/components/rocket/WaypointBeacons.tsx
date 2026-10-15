import { memo } from 'react'
import { computePathPoint, type PathDimensions, type WaypointSection } from './flight'
import './beacons.css'

export interface WaypointBeaconsProps {
  beacons: WaypointSection[]
  dims: PathDimensions
  activeBeaconIdx: number
  ripplingIdx: number | null
}

/**
 * Waypoint beacons rendered along the trajectory S-curve track.
 * - Passed beacons glow coral.
 * - Upcoming beacons are hollow sand rings.
 * - The next beacon pulses softly.
 * - When the rocket passes a beacon, a tiny ring ripple fires once.
 */
function WaypointBeaconsComponent({
  beacons,
  dims,
  activeBeaconIdx,
  ripplingIdx,
}: WaypointBeaconsProps) {
  if (beacons.length === 0) return null

  return (
    <g className="rocket-waypoints" aria-hidden="true">
      {beacons.map((beacon, i) => {
        const pt = computePathPoint(beacon.progress, dims)
        const isPassed = i < activeBeaconIdx
        const isNext = i === activeBeaconIdx
        const isRippling = ripplingIdx === i

        const statusClass = isPassed ? 'is-passed' : isNext ? 'is-next' : 'is-upcoming'

        return (
          <g
            key={beacon.id || i}
            transform={`translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`}
            className={`rocket-waypoint ${statusClass}`}
          >
            {/* Tiny ring ripple fired once on passing */}
            {isRippling && <circle cx="0" cy="0" r="4" className="rocket-waypoint-ripple" />}

            {/* Coral glow halo for passed beacons */}
            {isPassed && <circle cx="0" cy="0" r="5.5" className="rocket-waypoint-halo" />}

            {/* Core beacon dot / hollow ring */}
            <circle
              cx="0"
              cy="0"
              r={isNext ? 3.5 : 2.5}
              className="rocket-waypoint-dot"
            />
          </g>
        )
      })}
    </g>
  )
}

export const WaypointBeacons = memo(WaypointBeaconsComponent)
