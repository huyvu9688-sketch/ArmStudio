import { useMemo, useRef, useState } from 'react'
import { forwardKinematics } from '../kinematics/forward'
import { inverseKinematics } from '../kinematics/inverse'
import { useMachineStore } from '../state/machineStore'
import { usePendantStore } from '../state/pendantStore'
import { useRobotStore } from '../state/robotStore'
import { EditableAngle } from '../ui/EditableAngle'
import { JointBar } from '../ui/JointBar'
import type { IKFailureReason, Pose } from '../types'

/**
 * Cartesian jog grid — Phase 3 · Unit 3, drag/direct-entry as of this revision.
 *
 * Shown when the active frame is World/Tool/User. One row per X/Y/Z (mm) and
 * Rx/Ry/Rz (deg): a draggable limit bar plus a click-to-edit exact-value
 * readout, both committing through IK against the current TCP pose (instant
 * set, not a held jog — same semantics as the joint grid). Values/dragging are
 * always in world/base coordinates regardless of the Tool/User tab — true
 * per-frame axis jogging (along the tool's own Z, etc.) is a carried-forward
 * gap, not reintroduced here (see progress-tracker.md). Joint limits and
 * singularities are handled inside IK; an edit that can't be reached is
 * reported rather than silently dropped (architecture.md invariant #5).
 *
 * Drag anchoring: each drag step solves IK fresh, and a converged solve still
 * carries ~0.01 mm/0.006° residual error. Re-targeting the *other* five axes
 * off the live (already-slightly-off) pose on every pointermove compounds
 * that error across a drag — Y/Z visibly creep over a long X drag. `dragAnchor`
 * snapshots the pose once at drag-start; every step of that drag holds the
 * other axes to that fixed snapshot instead of the live pose, so error can't
 * accumulate. Click-to-edit (no drag) just uses the live pose — a single step
 * has nothing to compound.
 *
 * Sub-stepping: a click/drag can request a large jump in one axis (clicking
 * far from the thumb, or a fast drag) in a single `commitAxis` call. Solving
 * that in one IK shot is fine from a well-conditioned seed, but the home pose
 * (and any near-singular config) has a degenerate Jacobian — a single large
 * Newton step from there has no preference for the "nearby" elbow/wrist
 * configuration and can converge onto a completely different, distant
 * solution branch (the arm visibly reconfiguring instead of smoothly
 * extending). `commitAxis` walks the requested change in small increments,
 * each solve reseeded from the previous one's result, so the solver tracks a
 * single continuous path through joint space instead of leaping across
 * branches. The other five axes stay pinned to `base` (the anchor/pose
 * snapshot) for every sub-step — only `seed` (the joint-space starting guess)
 * progresses — so this doesn't reopen the drift this same fix just closed.
 */
const MAX_SUBSTEP = 5 // mm or deg, whichever this axis's unit is
const MAX_SUBSTEPS = 200
const AXES: {
  label: string
  unit: string
  key: keyof ReturnType<typeof forwardKinematics>
  min: number
  max: number
}[] = [
  { label: 'X', unit: ' mm', key: 'x', min: -700, max: 700 },
  { label: 'Y', unit: ' mm', key: 'y', min: -700, max: 700 },
  { label: 'Z', unit: ' mm', key: 'z', min: -700, max: 700 },
  { label: 'Rx', unit: '°', key: 'rx', min: -180, max: 180 },
  { label: 'Ry', unit: '°', key: 'ry', min: -180, max: 180 },
  { label: 'Rz', unit: '°', key: 'rz', min: -180, max: 180 },
]

const REASON_LABEL: Record<IKFailureReason, string> = {
  unreachable: 'Out of reach',
  singular: 'Singular',
  limit: 'Joint limit',
}

export function CartesianJog() {
  const angles = useRobotStore((s) => s.angles)
  const setAngles = useRobotStore((s) => s.setAngles)
  const frame = usePendantStore((s) => s.activeFrame)
  const motionEnabled = useMachineStore((s) => !s.estop && !s.hold)
  const pose = useMemo(() => forwardKinematics(angles), [angles])
  const [error, setError] = useState<{ label: string; reason: IKFailureReason } | null>(null)
  const dragAnchor = useRef<Pose | null>(null)

  function commitAxis(label: string, key: keyof ReturnType<typeof forwardKinematics>, value: number) {
    const base = dragAnchor.current ?? pose
    const start = pose[key]
    const delta = value - start
    const steps = Math.min(MAX_SUBSTEPS, Math.max(1, Math.ceil(Math.abs(delta) / MAX_SUBSTEP)))

    let seed = angles
    let lastOk: typeof angles | null = null
    for (let i = 1; i <= steps; i++) {
      const t = start + (delta * i) / steps
      const target = { ...base, [key]: t }
      const res = inverseKinematics(target, seed)
      if (!res.ok) {
        setError({ label, reason: res.reason })
        if (lastOk) setAngles(lastOk) // keep whatever progress was made before the move stopped
        return
      }
      seed = res.angles
      lastOk = res.angles
    }
    setError(null)
    setAngles(seed)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-faint text-[11px] font-semibold uppercase tracking-widest">
          {frame === 'tool' ? 'Tool jog' : frame === 'user' ? 'User jog' : 'World jog'}
        </span>
        <span className="text-faint font-mono text-[10px]">TCP via IK</span>
      </div>
      {AXES.map(({ label, unit, key, min, max }) => (
        <div key={label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between font-mono text-xs">
            <span className="text-primary">{label}</span>
            <EditableAngle
              value={pose[key]}
              unit={unit}
              disabled={!motionEnabled}
              onCommit={(v) => commitAxis(label, key, v)}
            />
          </div>
          <JointBar
            value={pose[key]}
            min={min}
            max={max}
            limitWarning={false}
            disabled={!motionEnabled}
            onDragStart={() => (dragAnchor.current = pose)}
            onDragEnd={() => (dragAnchor.current = null)}
            onChange={(v) => commitAxis(label, key, v)}
          />
        </div>
      ))}
      {error && (
        <span className="text-error font-mono text-[10px] font-semibold uppercase tracking-wide">
          ⚠ {error.label}: {REASON_LABEL[error.reason]}
        </span>
      )}
    </div>
  )
}
