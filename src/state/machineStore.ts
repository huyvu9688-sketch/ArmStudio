import { create } from 'zustand'

/**
 * Machine state store — Phase 2 · Unit 4.
 *
 * The arm's live safety/motion state, independent of joint pose (robotStore) and
 * jog settings (pendantStore). Drives the safety controls and the status strip.
 *
 *  - `estop`  latched emergency stop. Set on E-STOP press; cleared only by an
 *             explicit reset. While latched, all motion (jog, home, playback) is
 *             blocked.
 *  - `hold`   motion hold (pause). Blocks jogging/playback while engaged but is
 *             not latched — toggling it off re-enables motion.
 *  - `moving` a motion is currently executing (a continuous jog or, later, a
 *             program playing). Surfaced as the amber "moving" status.
 *
 * Every motion path consults this store before driving the robot, so pressing
 * E-STOP from anywhere halts an in-flight jog within one animation frame.
 */
export type RobotStatus = 'ready' | 'moving' | 'hold' | 'estop'

interface MachineStore {
  estop: boolean
  hold: boolean
  moving: boolean
  /** Latch the emergency stop and kill any in-flight motion. */
  engageEstop: () => void
  /** Clear the E-STOP latch (deliberate reset). */
  resetEstop: () => void
  /** Engage/release motion hold; engaging also stops current motion. */
  setHold: (hold: boolean) => void
  toggleHold: () => void
  /** Mark whether a motion is currently executing. */
  setMoving: (moving: boolean) => void
}

export const useMachineStore = create<MachineStore>((set) => ({
  estop: false,
  hold: false,
  moving: false,
  engageEstop: () => set({ estop: true, hold: false, moving: false }),
  resetEstop: () => set({ estop: false }),
  setHold: (hold) => set({ hold, moving: false }),
  toggleHold: () => set((s) => ({ hold: !s.hold, moving: false })),
  setMoving: (moving) => set({ moving }),
}))

/**
 * Derive the single status shown on the pendant/status strip, by priority:
 * E-STOP (latched fault) → Hold (paused) → Moving → Ready. Pure so the status
 * strip can subscribe to it directly and re-render only when the label changes.
 */
export function deriveStatus(s: { estop: boolean; hold: boolean; moving: boolean }): RobotStatus {
  if (s.estop) return 'estop'
  if (s.hold) return 'hold'
  if (s.moving) return 'moving'
  return 'ready'
}
