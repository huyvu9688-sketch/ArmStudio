import { describe, expect, it } from 'vitest'
import type { JointAngles, Pose } from '../types'
import { interpolatePose, lerpAngles, linearDistanceMm, maxJointDeltaDeg } from './motion'

const fromA: JointAngles = [0, 0, 0, 0, 0, 0]
const toA: JointAngles = [10, -20, 30, -40, 50, -60]

describe('lerpAngles', () => {
  it('hits the endpoints', () => {
    expect(lerpAngles(fromA, toA, 0)).toEqual(fromA)
    expect(lerpAngles(fromA, toA, 1)).toEqual(toA)
  })
  it('is the midpoint at t = 0.5', () => {
    expect(lerpAngles(fromA, toA, 0.5)).toEqual([5, -10, 15, -20, 25, -30])
  })
})

describe('interpolatePose', () => {
  const from: Pose = { x: 100, y: 0, z: 200, rx: 0, ry: 0, rz: 0 }
  const to: Pose = { x: 300, y: 100, z: 200, rx: 0, ry: 0, rz: 90 }

  it('hits the endpoints', () => {
    const a = interpolatePose(from, to, 0)
    expect(a.x).toBeCloseTo(from.x, 6)
    expect(a.rz).toBeCloseTo(from.rz, 6)
    const b = interpolatePose(from, to, 1)
    expect(b.x).toBeCloseTo(to.x, 6)
    expect(b.rz).toBeCloseTo(to.rz, 6)
  })

  it('interpolates position on a straight line', () => {
    const mid = interpolatePose(from, to, 0.5)
    expect(mid.x).toBeCloseTo(200, 6)
    expect(mid.y).toBeCloseTo(50, 6)
    expect(mid.z).toBeCloseTo(200, 6)
  })

  it('interpolates orientation along the shortest arc', () => {
    // Pure 0°→90° rotation about Z: quarter/half/three-quarter angles.
    expect(interpolatePose(from, to, 0.25).rz).toBeCloseTo(22.5, 4)
    expect(interpolatePose(from, to, 0.5).rz).toBeCloseTo(45, 4)
    expect(interpolatePose(from, to, 0.75).rz).toBeCloseTo(67.5, 4)
  })
})

describe('move distances', () => {
  it('maxJointDeltaDeg is the largest single-joint travel', () => {
    expect(maxJointDeltaDeg(fromA, toA)).toBe(60)
  })
  it('linearDistanceMm is the straight-line TCP distance', () => {
    const a: Pose = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 }
    const b: Pose = { x: 3, y: 4, z: 0, rx: 0, ry: 0, rz: 0 }
    expect(linearDistanceMm(a, b)).toBeCloseTo(5, 9)
  })
})
