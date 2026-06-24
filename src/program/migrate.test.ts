import { describe, expect, it } from 'vitest'
import { migrateProgram, ProgramMigrationError } from './migrate'
import { addInstruction, addWaypoint, createMovJ, createProgram, createWaypoint } from './instructionModel'
import type { JointAngles, Pose } from '../types'

const HOME_POSE: Pose = { x: 0, y: 0, z: 500, rx: 180, ry: 0, rz: 0 }
const HOME_ANGLES: JointAngles = [0, 0, 0, 0, 0, 0]

function sampleProgram() {
  const wp = createWaypoint('P1', HOME_POSE, HOME_ANGLES)
  let p = createProgram('test')
  p = addWaypoint(p, wp)
  p = addInstruction(p, createMovJ(wp.id, 50))
  return p
}

describe('migrateProgram', () => {
  it('round-trips a valid program through JSON', () => {
    const program = sampleProgram()
    const migrated = migrateProgram(JSON.parse(JSON.stringify(program)))
    expect(migrated).toEqual(program)
  })

  it('rejects non-objects', () => {
    expect(() => migrateProgram(null)).toThrow(ProgramMigrationError)
    expect(() => migrateProgram('not a program')).toThrow(ProgramMigrationError)
    expect(() => migrateProgram(42)).toThrow(ProgramMigrationError)
  })

  it('rejects an unsupported version', () => {
    const program = { ...sampleProgram(), version: 2 }
    expect(() => migrateProgram(program)).toThrow(ProgramMigrationError)
  })

  it('rejects a malformed waypoint', () => {
    const program = sampleProgram()
    const bad = { ...program, waypoints: [{ id: 'wp1', name: 'P1' }] } // missing pose/angles
    expect(() => migrateProgram(bad)).toThrow(ProgramMigrationError)
  })

  it('rejects a malformed instruction', () => {
    const program = sampleProgram()
    const bad = { ...program, instructions: [{ id: 'ins1', kind: 'MOVJ' }] } // missing waypointId/speedPct
    expect(() => migrateProgram(bad)).toThrow(ProgramMigrationError)
  })

  it('rejects an unrecognized instruction kind', () => {
    const program = sampleProgram()
    const bad = { ...program, instructions: [{ id: 'ins1', kind: 'JUMP' }] }
    expect(() => migrateProgram(bad)).toThrow(ProgramMigrationError)
  })
})
