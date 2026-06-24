import { useCallback, useEffect, useRef } from 'react'
import { mat4 } from 'gl-matrix'
import { JOINT_LIMITS } from '../config/dh-params'
import { forwardKinematicsMatrix } from '../kinematics/forward'
import { inverseKinematicsFromMatrix } from '../kinematics/inverse'
import { matMul, transpose } from '../kinematics/linalg'
import { eulerXYZToRot3, rot3AboutAxis, rot3FromMat4 } from '../kinematics/rotation'
import { deg2rad } from '../kinematics/units'
import { activeToolOffset, activeUserOffset, useFramesStore } from '../state/framesStore'
import { useMachineStore } from '../state/machineStore'
import { usePendantStore } from '../state/pendantStore'
import { useRobotStore } from '../state/robotStore'
import { jogRateDegPerSec, jogStep } from './jogMath'

/**
 * useJog — Phase 2 · Unit 2/3 + Phase 3 · Unit 3.
 *
 * The shared jog hook. Two jog kinds share one animation-frame loop and the
 * E-STOP/HOLD safety gate:
 *
 *  - Joint jog (`startJointJog`) — adds a clamped delta to one joint angle
 *    (continuous = speed-scaled rate; incremental = one step).
 *  - Cartesian jog (`startCartesianJog`) — moves the TCP along a World- or
 *    Tool-frame axis by solving IK each frame from the current configuration
 *    (X/Y/Z translate, Rx/Ry/Rz rotate). Continuous only; if IK can't follow
 *    (singularity / limit / out of reach) the jog stops.
 *
 * Each frame re-reads the stores via `getState()` so speed/frame changes apply
 * live without re-subscribing. Joint angles are clamped to JOINT_LIMITS before
 * any write (architecture.md invariant #4); Cartesian moves go through the active
 * IK which enforces the same limits.
 */

/** Maximum continuous joint-jog rate (deg/s) at 100 % speed override. */
export const MAX_JOG_RATE_DEG_PER_S = 60
/** Maximum Cartesian translation rate (m/s) at 100 % speed override. */
export const MAX_LINEAR_RATE_M_PER_S = 0.12
/** Maximum Cartesian rotation rate (rad/s) at 100 % speed override. */
export const MAX_ANGULAR_RATE_RAD_PER_S = deg2rad(45)
/** Cap per-frame dt so a backgrounded tab doesn't produce one huge jump. */
const MAX_FRAME_DT_S = 0.05

type JogTarget =
  | { kind: 'joint'; joint: number; dir: 1 | -1 }
  | { kind: 'cartesian'; axis: number; dir: 1 | -1 }

function applyJointDelta(joint: number, deltaDeg: number) {
  const { angles, setAngle } = useRobotStore.getState()
  setAngle(joint, jogStep(angles[joint], deltaDeg, JOINT_LIMITS[joint]))
}

/** Assemble a column-major transform (metres) from a 3×3 rotation + position. */
function matFromRot3Pos(R: number[][], p: readonly number[]): mat4 {
  return mat4.fromValues(
    R[0][0], R[1][0], R[2][0], 0,
    R[0][1], R[1][1], R[2][1], 0,
    R[0][2], R[1][2], R[2][2], 0,
    p[0], p[1], p[2], 1,
  )
}

/**
 * One Cartesian step: nudge the current TCP transform along the chosen axis in
 * the active frame, then solve IK. Returns false if the move can't be followed
 * (so the loop stops).
 *
 *  - `world` — along the fixed base axes (unaffected by registered frames).
 *  - `user`  — along the active user frame's axes (Phase 5 · Unit 6); a
 *    rotation conjugated through the user offset so "user Z" spins about the
 *    user frame's own Z, not the base's.
 *  - `tool`  — along the active tool frame's axes, composed with the live
 *    wrist orientation; rotation is conjugated through the tool offset within
 *    the wrist's local frame, same idea as `user` but on the other side of Rc.
 *
 * Frame *translation* offsets (where the tool/user origin sits, not just its
 * orientation) aren't applied here — only the axis directions are, per the
 * scoping decision in progress-tracker.md.
 */
function applyCartesianStep(
  axis: number,
  dir: 1 | -1,
  frame: 'world' | 'tool' | 'user',
  linDelta: number,
  angDelta: number,
): boolean {
  const angles = useRobotStore.getState().angles
  const cur = forwardKinematicsMatrix(angles)
  const Rc = rot3FromMat4(cur)
  let p = [cur[12], cur[13], cur[14]]
  let R = Rc

  const framesState = useFramesStore.getState()
  const userOffset = activeUserOffset(framesState)
  const toolOffset = activeToolOffset(framesState)
  const Ruser = eulerXYZToRot3(deg2rad(userOffset.rx), deg2rad(userOffset.ry), deg2rad(userOffset.rz))
  const Rtool = eulerXYZToRot3(deg2rad(toolOffset.rx), deg2rad(toolOffset.ry), deg2rad(toolOffset.rz))

  if (axis < 3) {
    // Translation, along the frame's own axis direction (a column of its rotation).
    let dirVec: number[]
    if (frame === 'world') {
      dirVec = [axis === 0 ? 1 : 0, axis === 1 ? 1 : 0, axis === 2 ? 1 : 0]
    } else if (frame === 'user') {
      dirVec = [Ruser[0][axis], Ruser[1][axis], Ruser[2][axis]]
    } else {
      const Rt = matMul(Rc, Rtool)
      dirVec = [Rt[0][axis], Rt[1][axis], Rt[2][axis]]
    }
    const s = dir * linDelta
    p = [p[0] + s * dirVec[0], p[1] + s * dirVec[1], p[2] + s * dirVec[2]]
  } else {
    // Rotation about X/Y/Z, conjugated into the active frame's own axes.
    const a = (axis - 3) as 0 | 1 | 2
    const RdLocal = rot3AboutAxis(a, dir * angDelta)
    if (frame === 'world') {
      R = matMul(RdLocal, Rc)
    } else if (frame === 'user') {
      const Rd = matMul(matMul(Ruser, RdLocal), transpose(Ruser))
      R = matMul(Rd, Rc)
    } else {
      const Rd = matMul(matMul(Rtool, RdLocal), transpose(Rtool))
      R = matMul(Rc, Rd)
    }
  }

  const res = inverseKinematicsFromMatrix(matFromRot3Pos(R, p), angles)
  if (!res.ok) return false
  useRobotStore.getState().setAngles(res.angles)
  return true
}

export function useJog() {
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef(0)
  const activeRef = useRef<JogTarget | null>(null)

  const stopJog = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (activeRef.current !== null) {
      activeRef.current = null
      useMachineStore.getState().setMoving(false)
    }
  }, [])

  const runContinuous = useCallback(
    (target: JogTarget) => {
      const machine = useMachineStore.getState()
      if (machine.estop || machine.hold) return
      activeRef.current = target
      machine.setMoving(true)
      lastTsRef.current = performance.now()

      const tick = (ts: number) => {
        const active = activeRef.current
        if (active === null) return
        const m = useMachineStore.getState()
        if (m.estop || m.hold) {
          stopJog()
          return
        }
        const dt = Math.min(MAX_FRAME_DT_S, (ts - lastTsRef.current) / 1000)
        lastTsRef.current = ts
        const { speedPct } = usePendantStore.getState()
        const scale = Math.max(0, Math.min(100, speedPct)) / 100

        if (active.kind === 'joint') {
          const rate = jogRateDegPerSec(speedPct, MAX_JOG_RATE_DEG_PER_S)
          applyJointDelta(active.joint, active.dir * rate * dt)
        } else {
          const frame = usePendantStore.getState().activeFrame
          const f = frame === 'tool' || frame === 'user' ? frame : 'world'
          const ok = applyCartesianStep(
            active.axis,
            active.dir,
            f,
            MAX_LINEAR_RATE_M_PER_S * scale * dt,
            MAX_ANGULAR_RATE_RAD_PER_S * scale * dt,
          )
          if (!ok) {
            stopJog()
            return
          }
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    [stopJog],
  )

  const startJointJog = useCallback(
    (joint: number, dir: 1 | -1) => {
      const machine = useMachineStore.getState()
      if (machine.estop || machine.hold) return
      const { jogMode, stepSize } = usePendantStore.getState()
      if (jogMode === 'incremental') {
        applyJointDelta(joint, dir * stepSize)
        return
      }
      runContinuous({ kind: 'joint', joint, dir })
    },
    [runContinuous],
  )

  const startCartesianJog = useCallback(
    (axis: number, dir: 1 | -1) => {
      // Cartesian jog is continuous only (incremental Cartesian steps arrive with
      // the programmer in Phase 4); the safety gate is checked in runContinuous.
      runContinuous({ kind: 'cartesian', axis, dir })
    },
    [runContinuous],
  )

  // Stop any in-flight jog if the owning component unmounts.
  useEffect(() => stopJog, [stopJog])

  return { startJointJog, startCartesianJog, stopJog }
}
