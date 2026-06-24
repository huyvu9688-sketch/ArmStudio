import { describe, expect, it } from 'vitest'
import { deserializeProgram, exportTp, serializeProgram } from './serialize'
import { ProgramMigrationError } from './migrate'
import {
  addInstruction,
  addWaypoint,
  createMovJ,
  createMovL,
  createProgram,
  createWait,
  createWaypoint,
} from './instructionModel'
import type { JointAngles, Pose } from '../types'

const HOME_POSE: Pose = { x: 0, y: 0, z: 500, rx: 180, ry: 0, rz: 0 }
const HOME_ANGLES: JointAngles = [0, 0, 0, 0, 0, 0]

function sampleProgram() {
  const wp1 = createWaypoint('P1', HOME_POSE, HOME_ANGLES)
  const wp2 = createWaypoint('P2', { ...HOME_POSE, x: 100 }, HOME_ANGLES)
  let p = createProgram('pick_place_v1')
  p = addWaypoint(p, wp1)
  p = addWaypoint(p, wp2)
  p = addInstruction(p, createMovJ(wp1.id, 50))
  p = addInstruction(p, createMovL(wp2.id, 100))
  p = addInstruction(p, createWait(0.5))
  return p
}

describe('serializeProgram / deserializeProgram', () => {
  it('round-trips a program', () => {
    const program = sampleProgram()
    const json = serializeProgram(program)
    expect(deserializeProgram(json)).toEqual(program)
  })

  it('rejects malformed JSON text', () => {
    expect(() => deserializeProgram('{not json')).toThrow()
  })

  it('rejects valid JSON that is not a program', () => {
    expect(() => deserializeProgram(JSON.stringify({ foo: 'bar' }))).toThrow(ProgramMigrationError)
  })
})

describe('exportTp', () => {
  it('lists the program name, every instruction, and every waypoint', () => {
    const tp = exportTp(sampleProgram())
    expect(tp).toContain('/PROG  pick_place_v1')
    expect(tp).toContain('MOVJ P[P1]')
    expect(tp).toContain('MOVL P[P2]')
    expect(tp).toContain('WAIT')
    expect(tp).toContain('P[P1]{')
    expect(tp).toContain('P[P2]{')
    expect(tp).toContain('/END')
  })
})
