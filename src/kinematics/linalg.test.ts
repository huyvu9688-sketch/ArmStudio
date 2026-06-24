import { describe, expect, it } from 'vitest'
import { determinant, identity, matMul, matVec, solve, transpose } from './linalg'

describe('linalg basics', () => {
  it('transpose', () => {
    expect(transpose([[1, 2, 3], [4, 5, 6]])).toEqual([[1, 4], [2, 5], [3, 6]])
  })

  it('matMul', () => {
    expect(matMul([[1, 2], [3, 4]], [[5, 6], [7, 8]])).toEqual([[19, 22], [43, 50]])
  })

  it('matVec', () => {
    expect(matVec([[1, 2], [3, 4]], [1, 1])).toEqual([3, 7])
  })

  it('identity', () => {
    expect(identity(3)).toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 1]])
  })
})

describe('solve', () => {
  it('solves a well-conditioned system', () => {
    // 2x + y = 5 ; x + 3y = 10  → x = 1, y = 3
    const x = solve([[2, 1], [1, 3]], [5, 10])
    expect(x).not.toBeNull()
    expect(x![0]).toBeCloseTo(1, 9)
    expect(x![1]).toBeCloseTo(3, 9)
  })

  it('round-trips against matVec for a 6×6 system', () => {
    const A = [
      [4, 1, 0, 0, 1, 0],
      [1, 5, 1, 0, 0, 1],
      [0, 1, 6, 1, 0, 0],
      [0, 0, 1, 7, 1, 0],
      [1, 0, 0, 1, 8, 1],
      [0, 1, 0, 0, 1, 9],
    ]
    const xTrue = [1, -2, 3, -4, 5, -6]
    const b = matVec(A, xTrue)
    const x = solve(A, b)!
    for (let i = 0; i < 6; i++) expect(x[i]).toBeCloseTo(xTrue[i], 8)
  })

  it('returns null for a singular matrix', () => {
    expect(solve([[1, 2], [2, 4]], [1, 2])).toBeNull()
  })
})

describe('determinant', () => {
  it('2×2 and 3×3 known values', () => {
    expect(determinant([[1, 2], [3, 4]])).toBeCloseTo(-2, 9)
    expect(determinant([[6, 1, 1], [4, -2, 5], [2, 8, 7]])).toBeCloseTo(-306, 6)
  })

  it('is 0 for a singular matrix', () => {
    expect(determinant([[1, 2], [2, 4]])).toBe(0)
  })
})
