import { mat4 } from 'gl-matrix'
import { HOME_ANGLES, JOINT_LIMITS } from '../config/dh-params'
import type { IKResult, JointAngles, Pose } from '../types'
import { forwardKinematicsMatrix } from './forward'
import { computeJacobian, manipulability, REFERENCE_MANIPULABILITY } from './jacobian'
import { matMul, matVec, solve, transpose } from './linalg'
import { eulerXYZToRot3, rot3FromMat4, rotationVectorFromRot3 } from './rotation'
import { deg2rad, mm2m, rad2deg } from './units'

/**
 * Inverse kinematics by damped least squares (DLS) — pure (no React/three/DOM).
 *
 * The classic 6R IK problem solved iteratively: starting from a seed
 * configuration, repeatedly take a Newton step that drives the 6-vector pose
 * error e = [Δposition (m); Δorientation (rotation-vector, rad)] to zero:
 *
 *   (J·Jᵀ + λ²I) y = e ,   Δθ = Jᵀ y
 *
 * The λ² damping keeps the step finite through singularities (Levenberg). A
 * backtracking line search guarantees the error decreases each accepted step, so
 * the solver converges to a tight tolerance on well-conditioned (near-seed)
 * targets — exactly the case for jogging and for "go to pose" from the current
 * configuration — while staying stable when the target is hard.
 *
 * Boundary (architecture.md invariants #3, #4, #5): the public API takes/returns
 * UI units (mm, deg); math runs in m/rad; joint angles are clamped to
 * JOINT_LIMITS each step; the result is the typed IKResult, never silent.
 */

const POS_TOL_M = 1e-5 // 0.01 mm
const ORI_TOL_RAD = 1e-4 // ~0.006°
const MAX_ITERS = 100
const LAMBDA = 0.01 // base DLS damping
const MAX_LINE_SEARCH = 8
/** Orientation weight (m per rad) so the line-search merit balances pos vs. ori. */
const ORI_WEIGHT_M = 0.25
/** Below this fraction of the reference manipulability, blame a singularity. */
const SINGULAR_RATIO = 0.02

/** Build a column-major transform (metres) from a UI Pose (mm + deg, XYZ Euler). */
function poseToMatrix(pose: Pose): mat4 {
  const R = eulerXYZToRot3(deg2rad(pose.rx), deg2rad(pose.ry), deg2rad(pose.rz))
  // gl-matrix is column-major: column c, row r → index c*4 + r.
  return mat4.fromValues(
    R[0][0], R[1][0], R[2][0], 0,
    R[0][1], R[1][1], R[2][1], 0,
    R[0][2], R[1][2], R[2][2], 0,
    mm2m(pose.x), mm2m(pose.y), mm2m(pose.z), 1,
  )
}

/** Pose error twist between a current and a target transform (both metres). */
function poseError(cur: mat4, target: mat4): { e: number[]; posErr: number; oriErr: number } {
  const ep = [target[12] - cur[12], target[13] - cur[13], target[14] - cur[14]]
  const Rerr = matMul(rot3FromMat4(target), transpose(rot3FromMat4(cur)))
  const eo = rotationVectorFromRot3(Rerr)
  return {
    e: [ep[0], ep[1], ep[2], eo[0], eo[1], eo[2]],
    posErr: Math.hypot(ep[0], ep[1], ep[2]),
    oriErr: Math.hypot(eo[0], eo[1], eo[2]),
  }
}

/** Scalar merit minimised by the line search (position + weighted orientation). */
function merit(posErr: number, oriErr: number): number {
  return posErr * posErr + (ORI_WEIGHT_M * oriErr) * (ORI_WEIGHT_M * oriErr)
}

function clampToLimitsRad(qRad: number[]): { q: number[]; clamped: boolean } {
  let clamped = false
  const q = qRad.slice()
  for (let k = 0; k < 6; k++) {
    const lo = deg2rad(JOINT_LIMITS[k].min)
    const hi = deg2rad(JOINT_LIMITS[k].max)
    if (q[k] < lo) {
      q[k] = lo
      clamped = true
    } else if (q[k] > hi) {
      q[k] = hi
      clamped = true
    }
  }
  return { q, clamped }
}

/** Evaluate the error at a configuration (radians) against the target. */
function errorAt(qRad: number[], target: mat4) {
  const deg = qRad.map(rad2deg) as JointAngles
  return poseError(forwardKinematicsMatrix(deg), target)
}

/**
 * Core solver against a target transform (metres). Exposed for the Cartesian jog
 * loop, which already has the target as a matrix and avoids a Pose round-trip.
 */
export function inverseKinematicsFromMatrix(target: mat4, seed: JointAngles): IKResult {
  let q = seed.map(deg2rad)
  let lastClampedAtLimit = false

  for (let iter = 0; iter < MAX_ITERS; iter++) {
    const here = errorAt(q, target)
    if (here.posErr < POS_TOL_M && here.oriErr < ORI_TOL_RAD) {
      return { ok: true, angles: q.map(rad2deg) as JointAngles }
    }

    const deg = q.map(rad2deg) as JointAngles
    const J = computeJacobian(deg)
    const Jt = transpose(J)
    const JJt = matMul(J, Jt)
    for (let k = 0; k < 6; k++) JJt[k][k] += LAMBDA * LAMBDA
    const y = solve(JJt, here.e)
    if (y === null) break // degenerate normal equations → singular
    const dq = matVec(Jt, y)

    // Backtracking line search: shrink the step until the merit decreases.
    const here0 = merit(here.posErr, here.oriErr)
    let alpha = 1
    let accepted = false
    for (let ls = 0; ls < MAX_LINE_SEARCH; ls++) {
      const tryQ = clampToLimitsRad(q.map((v, k) => v + alpha * dq[k]))
      const tryErr = errorAt(tryQ.q, target)
      if (merit(tryErr.posErr, tryErr.oriErr) < here0) {
        q = tryQ.q
        lastClampedAtLimit = tryQ.clamped
        accepted = true
        break
      }
      alpha *= 0.5
    }
    if (!accepted) break // stuck — no downhill step exists
  }

  // Did not converge → classify the failure (invariant #5).
  const finalDeg = q.map(rad2deg) as JointAngles
  if (manipulability(finalDeg) < SINGULAR_RATIO * REFERENCE_MANIPULABILITY) {
    return { ok: false, reason: 'singular' }
  }
  if (lastClampedAtLimit) return { ok: false, reason: 'limit' }
  return { ok: false, reason: 'unreachable' }
}

/**
 * Inverse kinematics for a target TCP pose. `seed` is the starting configuration
 * (defaults to home); pass the current angles for jogging / incremental moves so
 * the solver stays in the right solution branch.
 */
export function inverseKinematics(pose: Pose, seed: JointAngles = HOME_ANGLES): IKResult {
  return inverseKinematicsFromMatrix(poseToMatrix(pose), seed)
}
