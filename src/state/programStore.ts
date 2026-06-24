import { create } from 'zustand'
import { forwardKinematics } from '../kinematics/forward'
import {
  addInstruction,
  addWaypoint,
  createMovJ,
  createMovL,
  createProgram,
  createWait,
  createWaypoint,
  moveInstruction,
  removeInstruction,
  removeWaypoint,
} from '../program/instructionModel'
import type { JointAngles, Program } from '../types'

/**
 * Program store — Phase 4 · Unit 2.
 *
 * Thin zustand wrapper around the pure `instructionModel.ts` functions: the
 * editor UI and the TEACH button call these actions, never the pure functions
 * directly, so the active `Program` stays a single piece of state. One program
 * is held at a time for now; multi-program management (CALL targets, Save/
 * Load) is a later unit.
 */
interface ProgramStore {
  program: Program
  /** Capture the given joint angles (+ their FK pose) as a new named waypoint. */
  teachWaypoint: (angles: JointAngles) => void
  addMoveJ: (waypointId: string, speedPct: number) => void
  addMoveL: (waypointId: string, speedPct: number) => void
  addWait: (seconds: number) => void
  removeInstruction: (instructionId: string) => void
  removeWaypoint: (waypointId: string) => void
  moveInstruction: (fromIndex: number, toIndex: number) => void
  /** Replace the active program wholesale (Load from JSON). */
  loadProgram: (program: Program) => void
}

export const useProgramStore = create<ProgramStore>((set) => ({
  program: createProgram('untitled'),
  teachWaypoint: (angles) =>
    set((s) => {
      const pose = forwardKinematics(angles)
      const name = `P${s.program.waypoints.length + 1}`
      return { program: addWaypoint(s.program, createWaypoint(name, pose, angles)) }
    }),
  addMoveJ: (waypointId, speedPct) =>
    set((s) => ({ program: addInstruction(s.program, createMovJ(waypointId, speedPct)) })),
  addMoveL: (waypointId, speedPct) =>
    set((s) => ({ program: addInstruction(s.program, createMovL(waypointId, speedPct)) })),
  addWait: (seconds) =>
    set((s) => ({ program: addInstruction(s.program, createWait(seconds)) })),
  removeInstruction: (instructionId) =>
    set((s) => ({ program: removeInstruction(s.program, instructionId) })),
  removeWaypoint: (waypointId) =>
    set((s) => ({ program: removeWaypoint(s.program, waypointId) })),
  moveInstruction: (fromIndex, toIndex) =>
    set((s) => ({ program: moveInstruction(s.program, fromIndex, toIndex) })),
  loadProgram: (program) => set({ program }),
}))
