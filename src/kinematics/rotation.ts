import type { mat4 } from 'gl-matrix'

/**
 * Rotation helpers shared by IK, the Jacobian's orientation error, and motion
 * interpolation — pure, radians throughout.
 *
 * Matrices here are 3×3 row-major `number[][]` (the rotation part of a pose).
 * The Euler convention is intrinsic XYZ, identical to THREE.Euler 'XYZ' and to
 * the extractor in forward.ts, so orientations round-trip with forward
 * kinematics without re-deriving a convention.
 */

/** Extract the 3×3 rotation part of a column-major gl-matrix mat4 (row-major out). */
export function rot3FromMat4(m: mat4): number[][] {
  // Column-major index = col*4 + row.
  return [
    [m[0], m[4], m[8]],
    [m[1], m[5], m[9]],
    [m[2], m[6], m[10]],
  ]
}

/**
 * Intrinsic XYZ Euler angles (rad) → 3×3 rotation matrix, matching
 * THREE.Matrix4.makeRotationFromEuler order 'XYZ' (R = Rx·Ry·Rz).
 */
export function eulerXYZToRot3(rx: number, ry: number, rz: number): number[][] {
  const c1 = Math.cos(rx)
  const s1 = Math.sin(rx)
  const c2 = Math.cos(ry)
  const s2 = Math.sin(ry)
  const c3 = Math.cos(rz)
  const s3 = Math.sin(rz)

  return [
    [c2 * c3, -c2 * s3, s2],
    [c1 * s3 + c3 * s1 * s2, c1 * c3 - s1 * s2 * s3, -c2 * s1],
    [s1 * s3 - c1 * c3 * s2, c3 * s1 + c1 * s2 * s3, c1 * c2],
  ]
}

/**
 * 3×3 rotation matrix → intrinsic XYZ Euler angles (rad). Inverse of
 * eulerXYZToRot3; mirrors forward.ts' extractor (including the gimbal-lock pole
 * at ry ≈ ±90°, where rz collapses to 0).
 */
export function eulerXYZFromRot3(R: number[][]): [number, number, number] {
  const clamp = (v: number) => Math.min(1, Math.max(-1, v))
  const r02 = R[0][2]
  const ry = Math.asin(clamp(r02))

  if (Math.abs(r02) < 0.9999999) {
    return [Math.atan2(-R[1][2], R[2][2]), ry, Math.atan2(-R[0][1], R[0][0])]
  }
  // Gimbal lock.
  return [Math.atan2(R[2][1], R[1][1]), ry, 0]
}

/**
 * Rotation-vector (axis × angle, rad) of a rotation matrix — the so(3) logarithm.
 * Used as the orientation error in IK and as the geodesic direction for linear
 * (MOVL) orientation interpolation. Robust at the θ ≈ 0 and θ ≈ π poles.
 */
export function rotationVectorFromRot3(R: number[][]): [number, number, number] {
  const trace = R[0][0] + R[1][1] + R[2][2]
  const cosTheta = Math.min(1, Math.max(-1, (trace - 1) / 2))
  const theta = Math.acos(cosTheta)

  if (theta < 1e-8) return [0, 0, 0] // ~identity

  if (Math.PI - theta > 1e-6) {
    // General case: axis from the skew-symmetric part, scaled to length θ.
    const s = 2 * Math.sin(theta)
    return [
      ((R[2][1] - R[1][2]) / s) * theta,
      ((R[0][2] - R[2][0]) / s) * theta,
      ((R[1][0] - R[0][1]) / s) * theta,
    ]
  }

  // θ ≈ π: skew part vanishes; recover the axis from the diagonal of (R+I)/2.
  const xx = (R[0][0] + 1) / 2
  const yy = (R[1][1] + 1) / 2
  const zz = (R[2][2] + 1) / 2
  let ax = Math.sqrt(Math.max(0, xx))
  let ay = Math.sqrt(Math.max(0, yy))
  let az = Math.sqrt(Math.max(0, zz))
  // Fix the relative signs from the off-diagonal terms (pick the largest axis).
  if (ax >= ay && ax >= az) {
    ay = Math.sign(R[0][1] + R[1][0]) * ay
    az = Math.sign(R[0][2] + R[2][0]) * az
  } else if (ay >= az) {
    ax = Math.sign(R[0][1] + R[1][0]) * ax
    az = Math.sign(R[1][2] + R[2][1]) * az
  } else {
    ax = Math.sign(R[0][2] + R[2][0]) * ax
    ay = Math.sign(R[1][2] + R[2][1]) * ay
  }
  return [ax * theta, ay * theta, az * theta]
}

/**
 * Rotation matrix (3×3) from a rotation vector (axis × angle, rad) — Rodrigues'
 * formula, the so(3) exponential. Inverse of rotationVectorFromRot3.
 */
export function rot3FromRotationVector(v: [number, number, number]): number[][] {
  const theta = Math.hypot(v[0], v[1], v[2])
  if (theta < 1e-12) {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]
  }
  const kx = v[0] / theta
  const ky = v[1] / theta
  const kz = v[2] / theta
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  const t = 1 - c

  return [
    [c + kx * kx * t, kx * ky * t - kz * s, kx * kz * t + ky * s],
    [ky * kx * t + kz * s, c + ky * ky * t, ky * kz * t - kx * s],
    [kz * kx * t - ky * s, kz * ky * t + kx * s, c + kz * kz * t],
  ]
}

/** Rotation matrix (3×3) about a base axis (0=x,1=y,2=z) by angle (rad). */
export function rot3AboutAxis(axis: 0 | 1 | 2, angle: number): number[][] {
  const v: [number, number, number] = [0, 0, 0]
  v[axis] = angle
  return rot3FromRotationVector(v)
}
