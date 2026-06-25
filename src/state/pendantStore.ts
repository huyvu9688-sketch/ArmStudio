import { create } from 'zustand'

/**
 * Pendant settings store — Phase 2 · Unit 1.
 *
 * Holds the teach-pendant's *jog configuration*: which frame is active and
 * the speed override. This is UI/control state only — it never holds robot
 * pose (that lives in robotStore) or motion/safety state (that lives in
 * machineStore). Components read it; the program playback engine also reads
 * `speedPct` to drive recorded move speed (useMotion.ts).
 */

/** Jog reference frame. Only `joint` is active until IK lands in Phase 3. */
export type JogFrame = 'joint' | 'world' | 'tool' | 'user'

/** Speed override is a percentage of the maximum jog rate. */
export const SPEED_MIN = 1
export const SPEED_MAX = 100

interface PendantStore {
  /** Active jog frame (joint-space until Phase 3). */
  activeFrame: JogFrame
  /** Speed override, 1..100 % — scales recorded program move speed. */
  speedPct: number
  setFrame: (frame: JogFrame) => void
  setSpeedPct: (pct: number) => void
}

export const usePendantStore = create<PendantStore>((set) => ({
  activeFrame: 'joint',
  speedPct: 50,
  setFrame: (activeFrame) => set({ activeFrame }),
  setSpeedPct: (pct) =>
    set({ speedPct: Math.min(SPEED_MAX, Math.max(SPEED_MIN, Math.round(pct))) }),
}))
