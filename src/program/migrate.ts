import type { Instruction, JointAngles, Pose, Program, Waypoint } from '../types'

/**
 * Program JSON migrations — Phase 4 · Unit 4.
 *
 * Only version 1 exists today, but a loaded `.json` file is external input
 * (code-standards.md: "validate all external input at boundaries") — it may
 * be hand-edited, from a future version, or not a program at all. This
 * validates the shape before trusting it rather than casting `JSON.parse`'s
 * result straight to `Program`. Future format changes add a case keyed on
 * `version` here, instead of changing `Program` in place.
 */
export class ProgramMigrationError extends Error {}

function isJointAngles(v: unknown): v is JointAngles {
  return Array.isArray(v) && v.length === 6 && v.every((n) => typeof n === 'number')
}

function isPose(v: unknown): v is Pose {
  if (typeof v !== 'object' || v === null) return false
  const p = v as Record<string, unknown>
  return (['x', 'y', 'z', 'rx', 'ry', 'rz'] as const).every((k) => typeof p[k] === 'number')
}

function isWaypoint(v: unknown): v is Waypoint {
  if (typeof v !== 'object' || v === null) return false
  const w = v as Record<string, unknown>
  return typeof w.id === 'string' && typeof w.name === 'string' && isPose(w.pose) && isJointAngles(w.angles)
}

function isInstruction(v: unknown): v is Instruction {
  if (typeof v !== 'object' || v === null) return false
  const i = v as Record<string, unknown>
  if (typeof i.id !== 'string') return false
  switch (i.kind) {
    case 'MOVJ':
    case 'MOVL':
      return typeof i.waypointId === 'string' && typeof i.speedPct === 'number'
    case 'WAIT':
      return typeof i.seconds === 'number'
    case 'CALL':
      return typeof i.programId === 'string'
    default:
      return false
  }
}

/** Validate + migrate arbitrary parsed JSON into a `Program`. Throws `ProgramMigrationError` on anything unrecognized — never returns a half-valid program. */
export function migrateProgram(data: unknown): Program {
  if (typeof data !== 'object' || data === null) {
    throw new ProgramMigrationError('not a program file')
  }
  const d = data as Record<string, unknown>

  if (d.version !== 1) {
    throw new ProgramMigrationError(`unsupported program version: ${String(d.version)}`)
  }
  if (
    typeof d.id !== 'string' ||
    typeof d.name !== 'string' ||
    !Array.isArray(d.waypoints) ||
    !Array.isArray(d.instructions) ||
    !d.waypoints.every(isWaypoint) ||
    !d.instructions.every(isInstruction)
  ) {
    throw new ProgramMigrationError('malformed program file')
  }

  return {
    version: 1,
    id: d.id,
    name: d.name,
    waypoints: d.waypoints,
    instructions: d.instructions,
  }
}
