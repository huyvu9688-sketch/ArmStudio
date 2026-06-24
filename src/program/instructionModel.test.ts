import { describe, expect, it } from 'vitest'
import {
  addInstruction,
  addWaypoint,
  createCall,
  createMovJ,
  createMovL,
  createProgram,
  createWait,
  createWaypoint,
  moveInstruction,
  removeInstruction,
  removeWaypoint,
} from './instructionModel'
import type { JointAngles, Pose } from '../types'

const HOME_POSE: Pose = { x: 0, y: 0, z: 500, rx: 180, ry: 0, rz: 0 }
const HOME_ANGLES: JointAngles = [0, 0, 0, 0, 0, 0]

describe('instruction model', () => {
  it('creates an empty versioned program', () => {
    const p = createProgram('test')
    expect(p.version).toBe(1)
    expect(p.name).toBe('test')
    expect(p.waypoints).toHaveLength(0)
    expect(p.instructions).toHaveLength(0)
  })

  it('adds waypoints and instructions immutably', () => {
    const p0 = createProgram('test')
    const wp = createWaypoint('P1', HOME_POSE, HOME_ANGLES)
    const p1 = addWaypoint(p0, wp)
    expect(p0.waypoints).toHaveLength(0) // original untouched
    expect(p1.waypoints).toEqual([wp])

    const mov = createMovJ(wp.id, 50)
    const p2 = addInstruction(p1, mov)
    expect(p1.instructions).toHaveLength(0)
    expect(p2.instructions).toEqual([mov])
  })

  it('assigns distinct ids to waypoints and instructions', () => {
    const a = createWaypoint('A', HOME_POSE, HOME_ANGLES)
    const b = createWaypoint('B', HOME_POSE, HOME_ANGLES)
    expect(a.id).not.toBe(b.id)

    const m1 = createMovJ(a.id)
    const m2 = createMovL(a.id)
    expect(m1.id).not.toBe(m2.id)
  })

  it('builds MOVJ, MOVL, WAIT, and CALL instructions of the right kind', () => {
    expect(createMovJ('wp1').kind).toBe('MOVJ')
    expect(createMovL('wp1').kind).toBe('MOVL')
    expect(createWait(2).kind).toBe('WAIT')
    expect(createCall('prog1').kind).toBe('CALL')
  })

  it('removes an instruction by id', () => {
    const wp = createWaypoint('P1', HOME_POSE, HOME_ANGLES)
    const mov = createMovJ(wp.id)
    const wait = createWait(1)
    let p = createProgram('test')
    p = addWaypoint(p, wp)
    p = addInstruction(p, mov)
    p = addInstruction(p, wait)

    const p2 = removeInstruction(p, mov.id)
    expect(p2.instructions).toEqual([wait])
  })

  it('reorders instructions', () => {
    const wp = createWaypoint('P1', HOME_POSE, HOME_ANGLES)
    let p = createProgram('test')
    p = addWaypoint(p, wp)
    const i1 = createMovJ(wp.id)
    const i2 = createMovL(wp.id)
    const i3 = createWait(1)
    p = addInstruction(p, i1)
    p = addInstruction(p, i2)
    p = addInstruction(p, i3)

    const reordered = moveInstruction(p, 0, 2)
    expect(reordered.instructions.map((i) => i.id)).toEqual([i2.id, i3.id, i1.id])
  })

  it('removing a waypoint also drops instructions that reference it', () => {
    const wp1 = createWaypoint('P1', HOME_POSE, HOME_ANGLES)
    const wp2 = createWaypoint('P2', HOME_POSE, HOME_ANGLES)
    let p = createProgram('test')
    p = addWaypoint(p, wp1)
    p = addWaypoint(p, wp2)
    const movToWp1 = createMovJ(wp1.id)
    const movToWp2 = createMovL(wp2.id)
    const wait = createWait(1)
    p = addInstruction(p, movToWp1)
    p = addInstruction(p, movToWp2)
    p = addInstruction(p, wait)

    const p2 = removeWaypoint(p, wp1.id)
    expect(p2.waypoints).toEqual([wp2])
    expect(p2.instructions.map((i) => i.id)).toEqual([movToWp2.id, wait.id])
  })
})
