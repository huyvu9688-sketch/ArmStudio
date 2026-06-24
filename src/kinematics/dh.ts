import { glMatrix, mat4 } from 'gl-matrix'

/*
 * Use double-precision (plain Array) matrices instead of gl-matrix's default
 * Float32Array. Forward/inverse kinematics chain several transforms and rely on
 * an FK∘IK round-trip test; float32 rounding is too coarse for that tolerance.
 * Idempotent — safe to set from any kinematics module that imports this one.
 */
glMatrix.setMatrixArrayType(Array)

/**
 * Single standard (distal/Denavit–Hartenberg) link transform from frame i-1 to
 * frame i. Inputs are already in math units (metres, radians).
 *
 *   T_i = Rot_z(θ) · Trans_z(d) · Trans_x(a) · Rot_x(α)
 *
 *   ⎡ cθ   -sθ·cα    sθ·sα    a·cθ ⎤
 *   ⎢ sθ    cθ·cα   -cθ·sα    a·sθ ⎥
 *   ⎢ 0     sα       cα       d    ⎥
 *   ⎣ 0     0        0        1    ⎦
 *
 * Standard (not modified) DH: row i carries link i's own (a, α). This is the
 * convention the locked DH table in src/config is written for — under it the
 * table forms a correct waist/shoulder/elbow arm (J1 about vertical Z, J2/J3
 * about horizontal axes). See progress-tracker.md (Unit 5 DH-convention note).
 * Returned column-major for gl-matrix.
 */
export function dhTransform(
  a: number,
  alpha: number,
  d: number,
  theta: number,
): mat4 {
  const ct = Math.cos(theta)
  const st = Math.sin(theta)
  const ca = Math.cos(alpha)
  const sa = Math.sin(alpha)

  // gl-matrix is column-major: each row below is one COLUMN of the matrix.
  return mat4.fromValues(
    ct, st, 0, 0, // column 0
    -st * ca, ct * ca, sa, 0, // column 1
    st * sa, -ct * sa, ca, 0, // column 2
    a * ct, a * st, d, 1, // column 3 (translation)
  )
}
