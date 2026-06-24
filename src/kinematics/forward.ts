import { mat4 } from 'gl-matrix'
import { DH_PARAMS } from '../config/dh-params'
import type { JointAngles, Pose } from '../types'
import { dhTransform } from './dh'
import { deg2rad, rad2deg, m2mm, mm2m } from './units'

/**
 * Forward kinematics for the 6R arm — pure (no React/three.js/DOM).
 *
 * Boundary: takes JointAngles in DEGREES, returns a Pose in mm + degrees.
 * Internally everything is metres + radians, built from the locked DH table in
 * src/config (architecture.md invariants #1, #3, #7).
 */

/**
 * Cumulative base→joint-i transforms (metres), one per joint, J1..J6.
 * The last entry is the base→TCP transform. Reused by the TCP pose readout now
 * and by the Jacobian / DH frame gizmos in later phases.
 */
export function jointTransforms(angles: JointAngles): mat4[] {
  const frames: mat4[] = []
  const acc = mat4.create() // identity (base frame)

  for (let i = 0; i < DH_PARAMS.length; i++) {
    const p = DH_PARAMS[i]
    const theta = deg2rad(angles[i] + p.thetaOffset)
    const link = dhTransform(mm2m(p.a), deg2rad(p.alpha), mm2m(p.d), theta)
    mat4.multiply(acc, acc, link) // acc = acc · link
    frames.push(mat4.clone(acc))
  }

  return frames
}

/** Base→TCP homogeneous transform (metres, column-major). */
export function forwardKinematicsMatrix(angles: JointAngles): mat4 {
  const frames = jointTransforms(angles)
  return frames[frames.length - 1]
}

/** TCP pose for a set of joint angles. Position mm, orientation deg (XYZ). */
export function forwardKinematics(angles: JointAngles): Pose {
  const m = forwardKinematicsMatrix(angles)

  // Translation lives in column 3 (indices 12,13,14); metres → mm.
  const x = m2mm(m[12])
  const y = m2mm(m[13])
  const z = m2mm(m[14])

  const { rx, ry, rz } = eulerXYZFromMatrix(m)
  return { x, y, z, rx: rad2deg(rx), ry: rad2deg(ry), rz: rad2deg(rz) }
}

/**
 * Extract intrinsic XYZ Euler angles (radians) from the rotation part of a
 * column-major 4x4. Mirrors THREE.Euler.setFromRotationMatrix order 'XYZ' so
 * the scene can apply the result without re-deriving a convention. Handles the
 * gimbal-lock pole (cos(ry) ≈ 0) by collapsing rz to 0.
 */
function eulerXYZFromMatrix(m: mat4): { rx: number; ry: number; rz: number } {
  const clamp = (v: number) => Math.min(1, Math.max(-1, v))

  // Column-major index = col*4 + row. THREE's naming: m13=R02=m[8],
  // m23=R12=m[9], m33=R22=m[10], m12=R01=m[4], m11=R00=m[0], m32=R21=m[6],
  // m22=R11=m[5].
  const ry = Math.asin(clamp(m[8]))

  if (Math.abs(m[8]) < 0.9999999) {
    return {
      rx: Math.atan2(-m[9], m[10]),
      ry,
      rz: Math.atan2(-m[4], m[0]),
    }
  }
  // Gimbal lock: ry ≈ ±90°.
  return {
    rx: Math.atan2(m[6], m[5]),
    ry,
    rz: 0,
  }
}
