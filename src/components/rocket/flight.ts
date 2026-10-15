/**
 * Flight dynamics and mathematical utilities for the Zenin '26 ScrollRocket.
 * Pure mathematical functions for progress, path geometry, angles, velocity, landing,
 * waypoints, stage separation, altitude readouts, and re-entry heat.
 */

export interface PathDimensions {
  overlayWidth: number
  trackHeight: number
  topOffset: number
  bottomOffset: number
  amplitude: number
  centerOffset: number
  waves: number
}

export interface PathPoint {
  x: number
  y: number
}

export interface TangentVector {
  dx: number
  dy: number
}

export interface FlameState {
  scaleY: number
  scaleX: number
  opacity: number
}

export interface WaypointSection {
  id: string
  title: string
  progress: number
}

export interface ClearanceResult {
  isWithinBounds: boolean
  maxRightExtent: number
  rightClearance: number
}

/** Threshold below which the craft remains docked at the orbital station. */
export const DOCK_THRESHOLD = 0.03

/** Separation thresholds with hysteresis: detaches at 0.50 down, restores above 0.45 up. */
export const SEPARATION_DOWN_THRESHOLD = 0.5
export const SEPARATION_UP_THRESHOLD = 0.45

/** Descent progress threshold where nose cone re-entry glow begins. */
export const REENTRY_START_PROGRESS = 0.85

/** Default landing threshold where touchdown occurs. */
export const LANDING_THRESHOLD = 0.985

/**
 * Calculates normalized scroll progress [0, 1] clamped.
 * Returns 0 if content is not scrollable.
 */
export function calculateScrollProgress(
  scrollY: number,
  scrollHeight: number,
  innerHeight: number
): number {
  const maxScroll = scrollHeight - innerHeight
  if (maxScroll <= 0) return 0
  const raw = scrollY / maxScroll
  return Math.max(0, Math.min(1, raw))
}

/**
 * Computes overlay bounding dimensions based on viewport width and height.
 * Mobile (<640px) uses a tightened corridor hugging the right edge while preserving >= 8px clearance.
 * Desktop (>=640px) keeps the track well inside the right margin.
 */
export function computePathDimensions(
  viewportWidth: number,
  viewportHeight: number,
  isMobile: boolean
): PathDimensions {
  if (isMobile) {
    const overlayWidth = 44
    // Start below the top bar with room for the holding ring around the craft
    const topOffset = 108
    const bottomOffset = 96
    const trackHeight = Math.max(80, viewportHeight - topOffset - bottomOffset)
    return {
      overlayWidth,
      trackHeight,
      topOffset,
      bottomOffset,
      amplitude: 4.5,
      centerOffset: 16,
      waves: 2.0,
    }
  }

  const overlayWidth = Math.min(110, Math.max(76, viewportWidth * 0.08))
  // Start below the top bar with room for the holding ring around the craft
  const topOffset = 124
  const bottomOffset = 76
  const trackHeight = Math.max(100, viewportHeight - topOffset - bottomOffset)
  return {
    overlayWidth,
    trackHeight,
    topOffset,
    bottomOffset,
    amplitude: Math.min(18, overlayWidth * 0.18),
    centerOffset: overlayWidth * 0.42,
    waves: 2.0,
  }
}

/**
 * Computes the (x, y) coordinates along the gentle vertical S-curve.
 */
export function computePathPoint(
  p: number,
  dims: PathDimensions
): PathPoint {
  const clampedP = Math.max(0, Math.min(1, p))
  const y = dims.topOffset + clampedP * dims.trackHeight
  // Gentle sinusoidal wave with zero displacement at ends
  const x = dims.centerOffset + dims.amplitude * Math.sin(2 * Math.PI * dims.waves * clampedP)
  return { x, y }
}

/**
 * Computes the tangent vector (dx, dy) of the S-curve at progress p.
 */
export function computePathTangent(
  p: number,
  dims: PathDimensions
): TangentVector {
  const clampedP = Math.max(0, Math.min(1, p))
  const dy = dims.trackHeight
  const dx =
    dims.amplitude * 2 * Math.PI * dims.waves * Math.cos(2 * Math.PI * dims.waves * clampedP)
  return { dx, dy }
}

/**
 * Computes the rotation angle in degrees for the rocket.
 * The rocket SVG is oriented vertically UP (0 deg).
 * When scrolling down, it points generally DOWN (180 deg +- bank tilt).
 * When scrolling up, it flips to point generally UP (0 deg +- bank tilt).
 */
export function computeRocketAngle(
  dx: number,
  dy: number,
  isScrollingUp: boolean
): number {
  const tangentTiltDeg = (Math.atan2(dx, dy) * 180) / Math.PI
  if (isScrollingUp) {
    const raw = -tangentTiltDeg
    return raw === 0 ? 0 : raw
  }
  const raw = 180 - tangentTiltDeg
  return raw === 0 ? 0 : raw
}

/**
 * Performs shortest-path angular interpolation between two angles in degrees.
 */
export function lerpAngle(current: number, target: number, factor: number): number {
  let diff = (target - current) % 360
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360
  return current + diff * factor
}

/**
 * Standard linear interpolation.
 */
export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor
}

/**
 * Smooths raw velocity changes using exponential moving average.
 */
export function smoothVelocity(
  currentVel: number,
  rawDelta: number,
  alpha = 0.25
): number {
  return currentVel * (1 - alpha) + Math.abs(rawDelta) * alpha
}

/**
 * Checks whether the rocket has reached touchdown on its landing pad.
 */
export function isLanded(progress: number, threshold = LANDING_THRESHOLD): boolean {
  return progress >= threshold
}

/**
 * Computes flame scale and opacity according to scroll velocity and landing status.
 */
export function computeFlameScale(
  velocity: number,
  landed: boolean,
  isLaunching = false
): FlameState {
  if (landed && !isLaunching) {
    return { scaleY: 0, scaleX: 0, opacity: 0 }
  }

  if (isLaunching) {
    return { scaleY: 2.2, scaleX: 1.3, opacity: 1.0 }
  }

  const normalizedSpeed = Math.min(1, velocity / 1.5)
  const scaleY = 0.65 + normalizedSpeed * 1.15
  const scaleX = 0.85 + normalizedSpeed * 0.35
  const opacity = 0.75 + normalizedSpeed * 0.25

  return { scaleY, scaleX, opacity }
}

/**
 * Generates an SVG path 'd' string matching the computePathPoint curve.
 */
export function generateSvgPathString(
  dims: PathDimensions,
  steps = 50
): string {
  if (steps < 2) return ''
  const points: Array<[number, number]> = []
  for (let i = 0; i <= steps; i++) {
    const p = i / steps
    const pt = computePathPoint(p, dims)
    points.push([Number(pt.x.toFixed(2)), Number(pt.y.toFixed(2))])
  }

  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0]} ${points[i][1]}`
  }
  return d
}

/**
 * Determines if a new exhaust particle should be emitted this frame.
 */
export function shouldEmitParticle(
  velocity: number,
  landed: boolean,
  isMobile: boolean,
  activeCount: number,
  maxParticles: number
): boolean {
  if (landed) return false
  if (activeCount >= maxParticles) return false
  const minSpeed = isMobile ? 0.35 : 0.25
  return velocity > minSpeed
}

/**
 * Maps a heading's vertical page coordinate to normalized scroll progress:
 * (headingTop - innerHeight / 2) / maxScroll, clamped to [0, 1].
 */
export function calculateWaypointProgress(
  headingTop: number,
  innerHeight: number,
  maxScroll: number
): number {
  if (maxScroll <= 0) return 0
  const raw = (headingTop - innerHeight / 2) / maxScroll
  return Math.max(0, Math.min(1, raw))
}

/**
 * Formats telemetry altitude display counting down from maxAltitudeKm (default 400) to 0.
 */
export function formatAltitude(progress: number, maxAltitudeKm = 400): string {
  const clamped = Math.max(0, Math.min(1, progress))
  const km = Math.round((1 - clamped) * maxAltitudeKm)
  return `ALT ${km} KM`
}

/**
 * Returns the title of the active section (the last beacon passed at or before progress).
 */
export function getActiveSectionTitle(
  beacons: WaypointSection[],
  progress: number,
  fallback = 'ORBIT'
): string {
  let active = fallback
  for (const b of beacons) {
    if (progress >= b.progress) {
      active = b.title
    } else {
      break
    }
  }
  return active
}

/**
 * Computes stage separation state with hysteresis:
 * detaches when progress >= 0.50 going down;
 * restores booster when progress <= 0.45 going up.
 */
export function computeSeparationState(
  progress: number,
  currentSeparated: boolean
): boolean {
  if (!currentSeparated && progress >= SEPARATION_DOWN_THRESHOLD) {
    return true
  }
  if (currentSeparated && progress <= SEPARATION_UP_THRESHOLD) {
    return false
  }
  return currentSeparated
}

/**
 * Computes re-entry heat glow factor [0, 1] during the final 15% of descent.
 * Strength increases with progress toward landing and scales with velocity.
 */
export function computeReentryHeat(
  progress: number,
  velocity: number,
  startProgress = REENTRY_START_PROGRESS,
  landed = false
): number {
  if (landed || progress < startProgress) return 0
  const pNorm = Math.min(1, (progress - startProgress) / (1 - startProgress))
  const vNorm = Math.min(1, Math.max(0.15, velocity / 1.5))
  return Number((pNorm * vNorm).toFixed(3))
}

/**
 * Performs a rigorous clearance bounds check:
 * ensures the maximum rightward extent of the rotated craft bounding box
 * stays strictly within (overlayWidth - minClearance) px, guaranteeing >= minClearance px
 * of space next to the right viewport edge / scrollbar.
 */
export function checkCraftClearance(
  dims: PathDimensions,
  craftWidth: number,
  craftHeight: number,
  minClearance = 8
): ClearanceResult {
  const halfW = craftWidth / 2
  const halfH = craftHeight / 2
  const maxX = dims.centerOffset + dims.amplitude
  const maxDx = dims.amplitude * 2 * Math.PI * dims.waves
  const dy = dims.trackHeight
  const maxTiltRad = Math.atan2(maxDx, dy)
  const rotatedHalfExtent =
    halfW * Math.abs(Math.cos(maxTiltRad)) + halfH * Math.abs(Math.sin(maxTiltRad))
  const maxRightExtent = maxX + rotatedHalfExtent
  const rightClearance = dims.overlayWidth - maxRightExtent

  return {
    isWithinBounds: rightClearance >= minClearance,
    maxRightExtent: Number(maxRightExtent.toFixed(2)),
    rightClearance: Number(rightClearance.toFixed(2)),
  }
}
