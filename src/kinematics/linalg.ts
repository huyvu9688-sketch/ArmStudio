/**
 * Minimal dense linear algebra for the kinematics layer — pure, dependency-free.
 *
 * gl-matrix only covers 2..4-sized matrices; the 6×6 geometric Jacobian, the
 * damped-least-squares normal equations, and the manipulability determinant all
 * need general n×n. Matrices are row-major `number[][]`; vectors are `number[]`.
 * Everything here is double precision and side-effect free.
 */

/** Transpose an m×n matrix → n×m. */
export function transpose(A: number[][]): number[][] {
  const rows = A.length
  const cols = A[0].length
  const T: number[][] = Array.from({ length: cols }, () => new Array(rows).fill(0))
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) T[j][i] = A[i][j]
  }
  return T
}

/** Matrix product A·B (A is m×k, B is k×n) → m×n. */
export function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length
  const k = B.length
  const n = B[0].length
  const C: number[][] = Array.from({ length: m }, () => new Array(n).fill(0))
  for (let i = 0; i < m; i++) {
    for (let p = 0; p < k; p++) {
      const a = A[i][p]
      if (a === 0) continue
      for (let j = 0; j < n; j++) C[i][j] += a * B[p][j]
    }
  }
  return C
}

/** Matrix·vector A·x (A is m×n, x length n) → length m. */
export function matVec(A: number[][], x: number[]): number[] {
  const m = A.length
  const n = x.length
  const y = new Array(m).fill(0)
  for (let i = 0; i < m; i++) {
    let s = 0
    for (let j = 0; j < n; j++) s += A[i][j] * x[j]
    y[i] = s
  }
  return y
}

/** n×n identity. */
export function identity(n: number): number[][] {
  const I: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) I[i][i] = 1
  return I
}

/**
 * Solve A·x = b for a square A by Gaussian elimination with partial pivoting.
 * Returns `null` if A is (numerically) singular. Does not mutate its inputs.
 */
export function solve(Ain: number[][], bin: number[]): number[] | null {
  const n = Ain.length
  const A = Ain.map((r) => r.slice())
  const b = bin.slice()

  for (let col = 0; col < n; col++) {
    // Partial pivot: pick the largest-magnitude entry in this column.
    let pivot = col
    let max = Math.abs(A[col][col])
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(A[r][col])
      if (v > max) {
        max = v
        pivot = r
      }
    }
    if (max < 1e-12) return null // singular

    if (pivot !== col) {
      ;[A[col], A[pivot]] = [A[pivot], A[col]]
      ;[b[col], b[pivot]] = [b[pivot], b[col]]
    }

    // Eliminate below the pivot.
    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / A[col][col]
      if (f === 0) continue
      for (let c = col; c < n; c++) A[r][c] -= f * A[col][c]
      b[r] -= f * b[col]
    }
  }

  // Back-substitution.
  const x = new Array(n).fill(0)
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r]
    for (let c = r + 1; c < n; c++) s -= A[r][c] * x[c]
    x[r] = s / A[r][r]
  }
  return x
}

/**
 * Determinant of a square matrix via Gaussian elimination with partial pivoting.
 * Returns 0 for a (numerically) singular matrix. Does not mutate its input.
 */
export function determinant(Ain: number[][]): number {
  const n = Ain.length
  const A = Ain.map((r) => r.slice())
  let det = 1

  for (let col = 0; col < n; col++) {
    let pivot = col
    let max = Math.abs(A[col][col])
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(A[r][col])
      if (v > max) {
        max = v
        pivot = r
      }
    }
    if (max < 1e-15) return 0

    if (pivot !== col) {
      ;[A[col], A[pivot]] = [A[pivot], A[col]]
      det = -det
    }
    det *= A[col][col]

    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / A[col][col]
      for (let c = col; c < n; c++) A[r][c] -= f * A[col][c]
    }
  }
  return det
}
