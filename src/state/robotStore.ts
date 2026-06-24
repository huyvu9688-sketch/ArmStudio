import { create } from 'zustand'
import type { JointAngles } from '../types'
import { HOME_ANGLES } from '../config/dh-params'

/**
 * Robot state store — the single source of truth for live joint angles
 * (degrees). The scene reads this in its `useFrame` loop to pose the arm;
 * components never hold robot pose in local state (code-standards.md).
 *
 * Grows in later units (TCP pose cache, moving/fault flags mirrored from the
 * active driver, etc.). For Unit 6 it holds joint angles and setters.
 */
interface RobotStore {
  /** Joint angles J1..J6 in DEGREES. */
  angles: JointAngles
  /** Set one joint angle (degrees). */
  setAngle: (index: number, deg: number) => void
  /** Replace all six joint angles. */
  setAngles: (angles: JointAngles) => void
  /** Return to the home pose. */
  home: () => void
}

export const useRobotStore = create<RobotStore>((set) => ({
  angles: [...HOME_ANGLES] as JointAngles,
  setAngle: (index, deg) =>
    set((s) => {
      const next = [...s.angles] as JointAngles
      next[index] = deg
      return { angles: next }
    }),
  setAngles: (angles) => set({ angles: [...angles] as JointAngles }),
  home: () => set({ angles: [...HOME_ANGLES] as JointAngles }),
}))

// Dev-only console handle for manual verification before the pendant exists
// (Unit 7). Example: __robotStore.getState().setAngle(0, 90)
if (import.meta.env.DEV) {
  ;(globalThis as unknown as { __robotStore?: typeof useRobotStore }).__robotStore =
    useRobotStore
}
