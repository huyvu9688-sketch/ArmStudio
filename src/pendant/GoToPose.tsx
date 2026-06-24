import { useState } from 'react'
import { forwardKinematics } from '../kinematics/forward'
import { inverseKinematics } from '../kinematics/inverse'
import type { IKFailureReason, Pose } from '../types'
import { useMachineStore } from '../state/machineStore'
import { useRobotStore } from '../state/robotStore'
import { useMotion } from '../program/useMotion'
import { FrameTab } from '../ui/FrameTab'
import { PendantButton } from '../ui/PendantButton'

/**
 * Go-to-pose panel — Phase 3 · Unit 5.
 *
 * Enter a target TCP pose and move to it as MOVJ (joint move) or MOVL (straight
 * line). The target is validated with IK before motion starts, so an
 * unreachable / singular / limited target is reported up front (typed reason)
 * rather than failing silently (architecture.md invariant #5). "Set current"
 * fills the fields from the live pose. Disabled while E-STOP/HOLD/another move
 * blocks motion.
 */
type MoveType = 'MOVJ' | 'MOVL'

type Status =
  | { kind: 'idle' }
  | { kind: 'moving' }
  | { kind: 'done' }
  | { kind: 'error'; reason: IKFailureReason | 'aborted' }

const FIELDS: { key: keyof Pose; label: string; unit: string }[] = [
  { key: 'x', label: 'X', unit: 'mm' },
  { key: 'y', label: 'Y', unit: 'mm' },
  { key: 'z', label: 'Z', unit: 'mm' },
  { key: 'rx', label: 'Rx', unit: '°' },
  { key: 'ry', label: 'Ry', unit: '°' },
  { key: 'rz', label: 'Rz', unit: '°' },
]

const REASON_LABEL: Record<IKFailureReason | 'aborted', string> = {
  unreachable: 'Out of reach',
  singular: 'Singular',
  limit: 'Joint limit',
  aborted: 'Stopped',
}

function poseToFields(pose: Pose): Record<keyof Pose, string> {
  return {
    x: pose.x.toFixed(1),
    y: pose.y.toFixed(1),
    z: pose.z.toFixed(1),
    rx: pose.rx.toFixed(1),
    ry: pose.ry.toFixed(1),
    rz: pose.rz.toFixed(1),
  }
}

export function GoToPose() {
  const [fields, setFields] = useState<Record<keyof Pose, string>>(() =>
    poseToFields(forwardKinematics(useRobotStore.getState().angles)),
  )
  const [moveType, setMoveType] = useState<MoveType>('MOVJ')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const motionBlocked = useMachineStore((s) => s.estop || s.hold)
  const moving = useMachineStore((s) => s.moving)
  const { runMove } = useMotion()

  const parsed = FIELDS.map((f) => parseFloat(fields[f.key]))
  const valid = parsed.every((v) => Number.isFinite(v))

  const setCurrent = () => {
    setFields(poseToFields(forwardKinematics(useRobotStore.getState().angles)))
    setStatus({ kind: 'idle' })
  }

  const go = () => {
    if (!valid) return
    const target: Pose = {
      x: parsed[0], y: parsed[1], z: parsed[2],
      rx: parsed[3], ry: parsed[4], rz: parsed[5],
    }
    const res = inverseKinematics(target, useRobotStore.getState().angles)
    if (!res.ok) {
      setStatus({ kind: 'error', reason: res.reason })
      return
    }
    setStatus({ kind: 'moving' })
    const plan = moveType === 'MOVJ'
      ? ({ type: 'MOVJ', toAngles: res.angles } as const)
      : ({ type: 'MOVL', toPose: target } as const)
    runMove(plan, (o) =>
      setStatus(o.done ? { kind: 'done' } : { kind: 'error', reason: o.reason }),
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-faint text-[11px] font-semibold uppercase tracking-widest">
          Go to pose
        </span>
        <div className="flex gap-1">
          <FrameTab label="MOVJ" active={moveType === 'MOVJ'} className="px-2" onClick={() => setMoveType('MOVJ')} />
          <FrameTab label="MOVL" active={moveType === 'MOVL'} className="px-2" onClick={() => setMoveType('MOVL')} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-0.5">
            <span className="text-faint font-mono text-[10px]">{f.label} {f.unit}</span>
            <input
              type="number"
              value={fields[f.key]}
              onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))}
              className="w-full rounded-md border border-border-default bg-well px-1.5 py-1 font-mono text-xs text-primary outline-none focus:border-border-emphasis"
              aria-label={`Target ${f.label}`}
            />
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <PendantButton
          variant="amber"
          className="flex-1"
          disabled={motionBlocked || moving || !valid}
          onClick={go}
        >
          {moving ? 'Moving…' : 'Go'}
        </PendantButton>
        <PendantButton disabled={moving} onClick={setCurrent}>
          Set current
        </PendantButton>
      </div>

      {status.kind === 'error' && (
        <span className="text-error font-mono text-[10px] font-semibold uppercase tracking-wide">
          ⚠ {REASON_LABEL[status.reason]}
        </span>
      )}
      {status.kind === 'done' && (
        <span className="text-ready font-mono text-[10px] font-semibold uppercase tracking-wide">
          ✓ At target
        </span>
      )}
    </div>
  )
}
