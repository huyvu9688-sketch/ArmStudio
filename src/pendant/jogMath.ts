/**
 * Pure jog math — Phase 2 · Unit 2.
 *
 * Kept pure (no stores, no React) so it is unit tested directly and reused
 * wherever a joint angle or Cartesian axis value is clamped to its limit.
 */

/** Clamp a joint angle (deg) to its inclusive [min, max] travel limit. */
export function clampToLimit(angle: number, min: number, max: number): number {
  if (angle < min) return min
  if (angle > max) return max
  return angle
}
