import { describe, test, expect } from 'vitest'
import { forwardKinematics } from './forward'
import type { JointAngles } from '../types'

/**
 * FK known-value tests (Phase 1 · Unit 8).
 *
 * Expected TCP positions were derived analytically by hand from the locked
 * standard-DH table (p = Σ Cᵢ₋₁·tᵢ, with tᵢ = (aᵢcθ, aᵢsθ, dᵢ) and Cᵢ the
 * cumulative Rₓ(αᵢ)/Rz(θᵢ) rotations) — independent of the implementation, so a
 * regression in forward.ts fails here rather than silently snapshotting a bug.
 */
const expectPos = (
  angles: JointAngles,
  [x, y, z]: [number, number, number],
) => {
  const p = forwardKinematics(angles)
  expect(p.x).toBeCloseTo(x, 3)
  expect(p.y).toBeCloseTo(y, 3)
  expect(p.z).toBeCloseTo(z, 3)
}

describe('forwardKinematics — known positions', () => {
  test('home (all 0°) → (250, 0, -60)', () => {
    expectPos([0, 0, 0, 0, 0, 0], [250, 0, -60])
  })

  test('J1 = 90° (waist) → (0, 250, -60)', () => {
    expectPos([90, 0, 0, 0, 0, 0], [0, 250, -60])
  })

  test('J2 = 90° (shoulder) → (260, 0, 450)', () => {
    expectPos([0, 90, 0, 0, 0, 0], [260, 0, 450])
  })

  test('J3 = 90° (elbow) → (460, 0, 250)', () => {
    expectPos([0, 0, 90, 0, 0, 0], [460, 0, 250])
  })
})

describe('forwardKinematics — structural properties', () => {
  test('home orientation is a 180° flip about X', () => {
    const p = forwardKinematics([0, 0, 0, 0, 0, 0])
    expect(Math.abs(p.rx)).toBeCloseTo(180, 3)
    expect(p.ry).toBeCloseTo(0, 3)
    expect(p.rz).toBeCloseTo(0, 3)
  })

  test('J1 (waist) rotates about vertical: TCP height is invariant', () => {
    const z0 = forwardKinematics([0, 0, 0, 0, 0, 0]).z
    for (const q of [-170, -90, 45, 170]) {
      expect(forwardKinematics([q, 0, 0, 0, 0, 0]).z).toBeCloseTo(z0, 6)
    }
  })

  test('J1 rotation traces a constant-radius circle about the base', () => {
    const r0 = Math.hypot(
      forwardKinematics([0, 0, 0, 0, 0, 0]).x,
      forwardKinematics([0, 0, 0, 0, 0, 0]).y,
    )
    for (const q of [30, 90, -120]) {
      const p = forwardKinematics([q, 0, 0, 0, 0, 0])
      expect(Math.hypot(p.x, p.y)).toBeCloseTo(r0, 6)
    }
  })

  test('reach stays within the arm envelope (< 720 mm)', () => {
    const samples: JointAngles[] = [
      [0, 0, 0, 0, 0, 0],
      [0, 90, 0, 0, 0, 0],
      [0, 0, 90, 0, 0, 0],
      [45, 45, 45, 0, 0, 0],
      [0, -90, 60, 0, 0, 0],
    ]
    for (const a of samples) {
      const p = forwardKinematics(a)
      expect(Math.hypot(p.x, p.y, p.z)).toBeLessThan(720)
    }
  })
})
