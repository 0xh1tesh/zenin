/** Geometry for the cursor-aware sky: how near the pointer is, and how far a star drifts away from it. */

export interface RectLike {
  left: number
  top: number
  right: number
  bottom: number
}

export interface Offset {
  x: number
  y: number
}

/** Shortest distance from a point to a rectangle (0 when the point is inside it). */
export function distanceToRect(px: number, py: number, rect: RectLike): number {
  const dx = Math.max(rect.left - px, 0, px - rect.right)
  const dy = Math.max(rect.top - py, 0, py - rect.bottom)
  return Math.hypot(dx, dy)
}

/**
 * How far a star at (sx, sy) drifts away from the cursor at (px, py): strongest right under the cursor,
 * easing smoothly to nothing at `reach`. Returns null when the star is out of reach.
 */
export function repelOffset(
  px: number,
  py: number,
  sx: number,
  sy: number,
  reach: number,
  strength: number,
): Offset | null {
  const dx = sx - px
  const dy = sy - py
  const distance = Math.hypot(dx, dy)
  if (distance >= reach) return null
  const falloff = 1 - distance / reach
  const push = strength * falloff * falloff
  // Directly under the cursor there is no direction to push in; nudge upward.
  if (distance < 0.5) return { x: 0, y: -push }
  return { x: (dx / distance) * push, y: (dy / distance) * push }
}
