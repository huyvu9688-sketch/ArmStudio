import type { JointAngles, Pose } from '../types'
import { matMul, transpose } from '../kinematics/linalg'
import {
  eulerXYZFromRot3,
  eulerXYZToRot3,
  rot3FromRotationVector,
  rotationVectorFromRot3,
} from '../kinematics/rotation'
import { deg2rad, rad2deg } from '../kinematics/units'

/**
 * Motion interpolation — pure (no React/three/DOM). The kinematic difference
 * between the two basic moves a teach pendant offers:
 *
 *  - MOVJ (joint move): interpolate each joint angle linearly. Fast, but the TCP
 *    traces a curved path through space.
 *  - MOVL (linear move): interpolate the TCP *pose* — position on a straight line,
 *    orientation along the shortest rotation (geodesic). The playback engine runs
 *    IK at each interpolated pose, so the tool tip follows a straight line.
 *
 * `t` runs 0→1. These are the primitives the playback hook samples each frame and
 * that the offline programmer reuses in Phase 4.
 */

/** Per-joint linear interpolation (MOVJ), degrees. */
export function lerpAngles(from: JointAngles, to: JointAngles, t: number): JointAngles {
  return from.map((v, i) => v + (to[i] - v) * t) as JointAngles
}

/**
 * Pose interpolation (MOVL): straight-line position + geodesic (shortest-arc)
 * orientation. Orientation is interpolated as R(t) = R_from · exp(t · log(R_fromᵀ R_to)),
 * which avoids the gimbal artefacts of interpolating Euler angles directly.
 */
export function interpolatePose(from: Pose, to: Pose, t: number): Pose {
  const x = from.x + (to.x - from.x) * t
  const y = from.y + (to.y - from.y) * t
  const z = from.z + (to.z - from.z) * t

  const Rf = eulerXYZToRot3(deg2rad(from.rx), deg2rad(from.ry), deg2rad(from.rz))
  const Rt = eulerXYZToRot3(deg2rad(to.rx), deg2rad(to.ry), deg2rad(to.rz))
  const rel = rotationVectorFromRot3(matMul(transpose(Rf), Rt)) // in the from-frame
  const Rinterp = matMul(Rf, rot3FromRotationVector([rel[0] * t, rel[1] * t, rel[2] * t]))
  const [rx, ry, rz] = eulerXYZFromRot3(Rinterp)

  return { x, y, z, rx: rad2deg(rx), ry: rad2deg(ry), rz: rad2deg(rz) }
}

/** Largest single-joint travel (deg) of a joint move — sizes its duration. */
export function maxJointDeltaDeg(from: JointAngles, to: JointAngles): number {
  let m = 0
  for (let i = 0; i < 6; i++) m = Math.max(m, Math.abs(to[i] - from[i]))
  return m
}

/** Straight-line TCP travel (mm) of a linear move — sizes its duration. */
export function linearDistanceMm(from: Pose, to: Pose): number {
  return Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z)
}
