import { useCallback, useEffect, useRef } from 'react'
import { forwardKinematics } from '../kinematics/forward'
import { inverseKinematics } from '../kinematics/inverse'
import type { JointAngles, Pose } from '../types'
import { useMachineStore } from '../state/machineStore'
import { usePendantStore } from '../state/pendantStore'
import { useRobotStore } from '../state/robotStore'
import {
  interpolatePose,
  lerpAngles,
  linearDistanceMm,
  maxJointDeltaDeg,
} from './motion'

/**
 * useMotion — Phase 3 · Unit 4.
 *
 * Executes a single timed move into the robot store, the primitive the offline
 * programmer (Phase 4) will sequence. A move is planned as MOVJ (joint-space) or
 * MOVL (Cartesian straight line); duration is sized from the travel distance and
 * the speed override. The animation-frame loop writes the interpolated pose each
 * frame — MOVJ via joint lerp, MOVL by solving IK at each interpolated pose so
 * the TCP follows a straight line. Honors E-STOP/HOLD (aborts) and reports the
 * outcome via the completion callback.
 */
export type MovePlan =
  | { type: 'MOVJ'; toAngles: JointAngles }
  | { type: 'MOVL'; toPose: Pose }

export type MoveOutcome =
  | { done: true }
  | { done: false; reason: 'aborted' | 'singular' | 'limit' | 'unreachable' }

/** Nominal speeds at 100 % override. */
const JOINT_SPEED_DEG_S = 90
const LINEAR_SPEED_MM_S = 200
const MIN_DURATION_MS = 300
const MIN_SPEED_SCALE = 0.05

export function useMotion() {
  const rafRef = useRef<number | null>(null)
  const doneRef = useRef<((o: MoveOutcome) => void) | null>(null)

  const finish = useCallback((outcome: MoveOutcome) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    useMachineStore.getState().setMoving(false)
    const cb = doneRef.current
    doneRef.current = null
    cb?.(outcome)
  }, [])

  const cancelMove = useCallback(() => {
    if (rafRef.current !== null) finish({ done: false, reason: 'aborted' })
  }, [finish])

  const runMove = useCallback(
    (plan: MovePlan, onDone?: (o: MoveOutcome) => void) => {
      const machine = useMachineStore.getState()
      if (machine.estop || machine.hold) {
        onDone?.({ done: false, reason: 'aborted' })
        return
      }
      // Cancel any in-flight move before starting a new one.
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      doneRef.current = onDone ?? null

      const fromAngles = useRobotStore.getState().angles
      const speedScale = Math.max(
        MIN_SPEED_SCALE,
        usePendantStore.getState().speedPct / 100,
      )

      // Size the duration from travel distance and speed.
      let durationMs: number
      let fromPose: Pose | null = null
      if (plan.type === 'MOVJ') {
        const dist = maxJointDeltaDeg(fromAngles, plan.toAngles)
        durationMs = Math.max(MIN_DURATION_MS, (dist / (JOINT_SPEED_DEG_S * speedScale)) * 1000)
      } else {
        fromPose = forwardKinematics(fromAngles)
        const dist = linearDistanceMm(fromPose, plan.toPose)
        durationMs = Math.max(MIN_DURATION_MS, (dist / (LINEAR_SPEED_MM_S * speedScale)) * 1000)
      }

      machine.setMoving(true)
      const start = performance.now()

      const tick = (now: number) => {
        const m = useMachineStore.getState()
        if (m.estop || m.hold) {
          finish({ done: false, reason: 'aborted' })
          return
        }
        const t = Math.min(1, (now - start) / durationMs)

        if (plan.type === 'MOVJ') {
          useRobotStore.getState().setAngles(lerpAngles(fromAngles, plan.toAngles, t))
        } else {
          const pose = interpolatePose(fromPose!, plan.toPose, t)
          const res = inverseKinematics(pose, useRobotStore.getState().angles)
          if (!res.ok) {
            finish({ done: false, reason: res.reason })
            return
          }
          useRobotStore.getState().setAngles(res.angles)
        }

        if (t >= 1) {
          finish({ done: true })
          return
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    [finish],
  )

  // Abort any in-flight move if the owning component unmounts.
  useEffect(() => cancelMove, [cancelMove])

  return { runMove, cancelMove }
}
