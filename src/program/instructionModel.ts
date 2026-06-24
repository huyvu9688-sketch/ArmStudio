import type { Call, Instruction, JointAngles, MovJ, MovL, Pose, Program, Wait, Waypoint } from '../types'

/**
 * Instruction + program model — pure (no React/three/DOM). This is the data
 * shape the Phase 4 editor and playback engine operate on; it owns no UI and
 * no playback logic (that's `motion.ts`/`useMotion.ts`).
 *
 * Every mutation here returns a new `Program` (immutable) so it composes
 * cleanly with zustand/React state later.
 */

/** Local id — these are object identifiers within a program, not security tokens. */
function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export function createWaypoint(name: string, pose: Pose, angles: JointAngles): Waypoint {
  return { id: genId('wp'), name, pose, angles }
}

export function createProgram(name: string): Program {
  return { version: 1, id: genId('prog'), name, waypoints: [], instructions: [] }
}

export function addWaypoint(program: Program, waypoint: Waypoint): Program {
  return { ...program, waypoints: [...program.waypoints, waypoint] }
}

export function removeWaypoint(program: Program, waypointId: string): Program {
  return {
    ...program,
    waypoints: program.waypoints.filter((w) => w.id !== waypointId),
    instructions: program.instructions.filter(
      (ins) => !('waypointId' in ins) || ins.waypointId !== waypointId,
    ),
  }
}

export function createMovJ(waypointId: string, speedPct = 100): MovJ {
  return { id: genId('ins'), kind: 'MOVJ', waypointId, speedPct }
}

export function createMovL(waypointId: string, speedPct = 100): MovL {
  return { id: genId('ins'), kind: 'MOVL', waypointId, speedPct }
}

export function createWait(seconds: number): Wait {
  return { id: genId('ins'), kind: 'WAIT', seconds }
}

export function createCall(programId: string): Call {
  return { id: genId('ins'), kind: 'CALL', programId }
}

export function addInstruction(program: Program, instruction: Instruction): Program {
  return { ...program, instructions: [...program.instructions, instruction] }
}

export function removeInstruction(program: Program, instructionId: string): Program {
  return {
    ...program,
    instructions: program.instructions.filter((ins) => ins.id !== instructionId),
  }
}

/** Move the instruction at `fromIndex` to `toIndex` (both clamped to the array bounds). */
export function moveInstruction(program: Program, fromIndex: number, toIndex: number): Program {
  const instructions = [...program.instructions]
  const last = instructions.length - 1
  const from = Math.max(0, Math.min(fromIndex, last))
  const to = Math.max(0, Math.min(toIndex, last))
  const [moved] = instructions.splice(from, 1)
  instructions.splice(to, 0, moved)
  return { ...program, instructions }
}
