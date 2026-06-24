import { create } from 'zustand'

/**
 * Pendant settings store — Phase 2 · Unit 1.
 *
 * Holds the teach-pendant's *jog configuration*: which frame is active, the jog
 * mode (continuous hold-to-jog vs. single incremental step), the incremental
 * step size, and the speed override. This is UI/control state only — it never
 * holds robot pose (that lives in robotStore) or motion/safety state (that lives
 * in machineStore). Components read it; the jog hook reads it each frame.
 */

/** Jog reference frame. Only `joint` is active until IK lands in Phase 3. */
export type JogFrame = 'joint' | 'world' | 'tool' | 'user'

/** Continuous = hold-to-jog at a speed-scaled rate; incremental = one step per press. */
export type JogMode = 'continuous' | 'incremental'

/** Selectable incremental jog step sizes (degrees), fine → coarse. */
export const STEP_SIZES = [1, 5, 30, 90] as const
export type StepSize = (typeof STEP_SIZES)[number]

/** Speed override is a percentage of the maximum jog rate. */
export const SPEED_MIN = 1
export const SPEED_MAX = 100

interface PendantStore {
  /** Active jog frame (joint-space until Phase 3). */
  activeFrame: JogFrame
  /** Continuous or incremental jogging. */
  jogMode: JogMode
  /** Step size (deg) applied per press in incremental mode. */
  stepSize: StepSize
  /** Speed override, 1..100 % — scales the continuous jog rate. */
  speedPct: number
  setFrame: (frame: JogFrame) => void
  setJogMode: (mode: JogMode) => void
  setStepSize: (step: StepSize) => void
  setSpeedPct: (pct: number) => void
}

export const usePendantStore = create<PendantStore>((set) => ({
  activeFrame: 'joint',
  jogMode: 'continuous',
  stepSize: 5,
  speedPct: 50,
  setFrame: (activeFrame) => set({ activeFrame }),
  setJogMode: (jogMode) => set({ jogMode }),
  setStepSize: (stepSize) => set({ stepSize }),
  setSpeedPct: (pct) =>
    set({ speedPct: Math.min(SPEED_MAX, Math.max(SPEED_MIN, Math.round(pct))) }),
}))
