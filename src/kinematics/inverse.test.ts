import { describe, expect, it } from 'vitest'
import { JOINT_LIMITS } from '../config/dh-params'
import type { JointAngles } from '../types'
import { forwardKinematics } from './forward'
import { inverseKinematics } from './inverse'

/** Clamp a config into the joint limits (for building valid seeds/targets). */
function clampAngles(q: number[]): JointAngles {
  return q.map((v, i) =>
    Math.min(JOINT_LIMITS[i].max, Math.max(JOINT_LIMITS[i].min, v)),
  ) as JointAngles
}

function expectPoseClose(a: ReturnType<typeof forwardKinematics>, b: ReturnType<typeof forwardKinematics>) {
  expect(Math.abs(a.x - b.x)).toBeLessThan(0.05) // mm
  expect(Math.abs(a.y - b.y)).toBeLessThan(0.05)
  expect(Math.abs(a.z - b.z)).toBeLessThan(0.05)
  expect(Math.abs(a.rx - b.rx)).toBeLessThan(0.05) // deg
  expect(Math.abs(a.ry - b.ry)).toBeLessThan(0.05)
  expect(Math.abs(a.rz - b.rz)).toBeLessThan(0.05)
}

describe('inverseKinematics — round trip fk(ik(pose)) ≈ pose', () => {
  // Interior, non-singular configurations (J5 ≠ 0, all within limits).
  const configs: JointAngles[] = [
    [20, 30, -40, 25, 40, 15],
    [-30, 40, -60, -20, 50, -30],
    [60, -30, 20, 90, -40, 45],
    [0, 60, -80, 10, 70, -10],
  ]

  it('recovers a configuration that reproduces the target pose', () => {
    for (const q of configs) {
      const target = forwardKinematics(q)
      // Seed away from the answer so the solver must actually iterate.
      const seed = clampAngles(q.map((v) => v + 5))
      const res = inverseKinematics(target, seed)
      expect(res.ok).toBe(true)
      if (res.ok) {
        expectPoseClose(forwardKinematics(res.angles), target)
        // Returned angles respect the joint limits (invariant #4).
        res.angles.forEach((a, i) => {
          expect(a).toBeGreaterThanOrEqual(JOINT_LIMITS[i].min - 1e-6)
          expect(a).toBeLessThanOrEqual(JOINT_LIMITS[i].max + 1e-6)
        })
      }
    }
  })

  it('returns the seed immediately when already at the target', () => {
    const q: JointAngles = [10, 20, -30, 15, 45, 5]
    const res = inverseKinematics(forwardKinematics(q), q)
    expect(res.ok).toBe(true)
    if (res.ok) res.angles.forEach((a, i) => expect(a).toBeCloseTo(q[i], 4))
  })
})

describe('inverseKinematics — typed failures', () => {
  it('reports a target far outside the workspace as not-ok', () => {
    const res = inverseKinematics({ x: 2000, y: 0, z: 500, rx: 0, ry: 0, rz: 0 })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(['unreachable', 'limit', 'singular']).toContain(res.reason)
  })
})
