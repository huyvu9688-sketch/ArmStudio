import type { JointLimit } from '../types'

/**
 * Pure jog math — Phase 2 · Unit 2.
 *
 * Joint-space jogging reduces to "add a signed delta, then clamp to the joint's
 * travel limit". Both jog modes feed this: continuous uses `rate · dt`,
 * incremental uses `±stepSize`. Kept pure (no stores, no React) so it is unit
 * tested directly and reused wherever a joint angle is nudged.
 */

/** Clamp a joint angle (deg) to its inclusive [min, max] travel limit. */
export function clampToLimit(angle: number, min: number, max: number): number {
  if (angle < min) return min
  if (angle > max) return max
  return angle
}

/** Next joint angle after a signed jog delta (deg), clamped to the limit. */
export function jogStep(current: number, deltaDeg: number, limit: JointLimit): number {
  return clampToLimit(current + deltaDeg, limit.min, limit.max)
}

/**
 * Continuous-jog angular rate (deg/s) for a given speed override. The override
 * is a percentage of `maxRate`; out-of-range percentages are clamped to 0..100.
 */
export function jogRateDegPerSec(speedPct: number, maxRate: number): number {
  const pct = Math.max(0, Math.min(100, speedPct))
  return maxRate * (pct / 100)
}
