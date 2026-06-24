import { DH_PARAMS } from '../config/dh-params'
import type { JointAngles } from '../types'
import { jointTransforms } from './forward'
import { determinant } from './linalg'

/**
 * Geometric Jacobian and manipulability — pure (no React/three.js/DOM).
 *
 * The Jacobian J maps joint rates (rad/s) to the TCP spatial velocity
 * [v; ω] (m/s, rad/s) in the base frame. For our all-revolute arm each column is
 *
 *   Jᵢ = [ zᵢ₋₁ × (pₑ − pᵢ₋₁) ;  zᵢ₋₁ ]
 *
 * where zᵢ₋₁ and pᵢ₋₁ are the axis and origin of frame i−1 (the base for joint 1)
 * and pₑ is the TCP origin, all read from the cumulative DH transforms (metres).
 */

/** 6×6 geometric Jacobian (row-major: rows [vx,vy,vz,wx,wy,wz], cols J1..J6). */
export function computeJacobian(angles: JointAngles): number[][] {
  const frames = jointTransforms(angles) // base→Jᵢ, metres; last = TCP
  const tcp = frames[frames.length - 1]
  const pe = [tcp[12], tcp[13], tcp[14]]

  const J: number[][] = [[], [], [], [], [], []]
  for (let i = 0; i < DH_PARAMS.length; i++) {
    // Axis z and origin p of the frame *before* joint i (base frame for i = 0).
    let z: [number, number, number]
    let p: [number, number, number]
    if (i === 0) {
      z = [0, 0, 1]
      p = [0, 0, 0]
    } else {
      const T = frames[i - 1]
      z = [T[8], T[9], T[10]] // third column = local Z in base
      p = [T[12], T[13], T[14]]
    }

    const d = [pe[0] - p[0], pe[1] - p[1], pe[2] - p[2]]
    // Linear part: z × (pe − p).
    J[0][i] = z[1] * d[2] - z[2] * d[1]
    J[1][i] = z[2] * d[0] - z[0] * d[2]
    J[2][i] = z[0] * d[1] - z[1] * d[0]
    // Angular part: z.
    J[3][i] = z[0]
    J[4][i] = z[1]
    J[5][i] = z[2]
  }
  return J
}

/**
 * Yoshikawa manipulability w = √det(J·Jᵀ). For the square 6×6 Jacobian this is
 * |det J| (cheaper, identical), and it collapses to 0 at a singularity. It is a
 * scale-dependent measure, so the UI reports it relative to a known-good config
 * (see REFERENCE_MANIPULABILITY).
 */
export function manipulability(angles: JointAngles): number {
  return Math.abs(determinant(computeJacobian(angles)))
}

/**
 * Manipulability at a deliberately well-conditioned pose (elbow bent, wrist off
 * its singular alignment). Used to normalise the live readout so the singularity
 * warning is independent of the arm's absolute length scale.
 */
export const REFERENCE_MANIPULABILITY = manipulability([0, 45, -90, 0, 60, 0])

/** Below this fraction of the reference, the arm is flagged "near singular". */
export const SINGULARITY_WARN_RATIO = 0.08

/** Manipulability normalised to the reference config (≈1 at a good pose, 0 singular). */
export function manipulabilityRatio(angles: JointAngles): number {
  return manipulability(angles) / REFERENCE_MANIPULABILITY
}
