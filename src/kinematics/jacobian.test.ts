import { describe, expect, it } from 'vitest'
import type { JointAngles } from '../types'
import { forwardKinematicsMatrix } from './forward'
import { computeJacobian, manipulability } from './jacobian'
import { matMul, transpose } from './linalg'
import { rot3FromMat4, rotationVectorFromRot3 } from './rotation'
import { deg2rad } from './units'

/**
 * The geometric Jacobian must agree with a finite-difference derivative of the
 * forward kinematics — an implementation-independent cross-check. For a small
 * joint perturbation h (deg), column j should satisfy:
 *   Jv·,ⱼ ≈ Δposition / Δθ(rad)   and   Jw·,ⱼ ≈ Δrotation-vector / Δθ(rad).
 */
function numericColumn(q: JointAngles, j: number, hDeg: number) {
  const m0 = forwardKinematicsMatrix(q)
  const qp = q.slice() as JointAngles
  qp[j] += hDeg
  const m1 = forwardKinematicsMatrix(qp)
  const dRad = deg2rad(hDeg)

  const dv = [(m1[12] - m0[12]) / dRad, (m1[13] - m0[13]) / dRad, (m1[14] - m0[14]) / dRad]
  const Rerr = matMul(rot3FromMat4(m1), transpose(rot3FromMat4(m0)))
  const w = rotationVectorFromRot3(Rerr).map((v) => v / dRad)
  return [...dv, ...w]
}

describe('computeJacobian vs. finite-difference FK', () => {
  const configs: JointAngles[] = [
    [10, -20, 30, 40, -50, 15],
    [-30, 40, -60, -20, 50, -30],
    [60, -30, 20, 90, -40, 45],
  ]

  it('matches the FK derivative column by column', () => {
    for (const q of configs) {
      const J = computeJacobian(q)
      for (let j = 0; j < 6; j++) {
        const num = numericColumn(q, j, 1e-4)
        for (let r = 0; r < 6; r++) {
          expect(J[r][j]).toBeCloseTo(num[r], 4)
        }
      }
    }
  })
})

describe('manipulability', () => {
  it('is positive at a well-conditioned configuration', () => {
    expect(manipulability([0, 45, -90, 0, 60, 0])).toBeGreaterThan(0)
  })

  it('collapses toward zero at the wrist singularity (J5 = 0)', () => {
    const good = manipulability([0, 45, -90, 0, 60, 0])
    const singular = manipulability([0, 45, -90, 0, 0, 0])
    expect(singular).toBeLessThan(good)
    expect(singular).toBeLessThan(1e-6)
  })
})
