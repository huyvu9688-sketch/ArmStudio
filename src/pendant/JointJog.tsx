import { JOINT_LIMITS } from '../config/dh-params'
import { GLB_JOINT_MAP } from '../config/glb-joint-map'
import { useMachineStore } from '../state/machineStore'
import { useRobotStore } from '../state/robotStore'
import { EditableAngle } from '../ui/EditableAngle'
import { JointBar } from '../ui/JointBar'
import { clampToLimit } from './jogMath'

/**
 * Joint jog grid — Phase 2 · Unit 2.
 *
 * One row per joint: a draggable limit bar (drag anywhere along it to set
 * the angle proportionally — instant set, not a held jog) plus a click-to-edit
 * exact-value readout, both clamped to JOINT_LIMITS. Disabled while E-STOP/
 * HOLD block motion. Presentational — no kinematics here (code-standards.md).
 *
 * On the current 4-DOF model J4/J6 have no GLB pivot, so they drive the store /
 * FK pose but not the mesh — flagged inline.
 */
export function JointJog() {
  const angles = useRobotStore((s) => s.angles)
  const setAngle = useRobotStore((s) => s.setAngle)
  const motionEnabled = useMachineStore((s) => !s.estop && !s.hold)

  return (
    <div className="flex flex-col gap-2">
      {JOINT_LIMITS.map((lim, i) => {
        const noPivot = GLB_JOINT_MAP[i].node === null
        return (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between font-mono text-xs">
              <span className="text-primary">
                J{i + 1}
                {noPivot && <span className="text-faint"> · no pivot</span>}
              </span>
              <EditableAngle
                value={angles[i]}
                disabled={!motionEnabled}
                onCommit={(deg) => setAngle(i, clampToLimit(deg, lim.min, lim.max))}
              />
            </div>
            <JointBar
              value={angles[i]}
              min={lim.min}
              max={lim.max}
              disabled={!motionEnabled}
              onChange={(deg) => setAngle(i, clampToLimit(deg, lim.min, lim.max))}
            />
            <div className="flex justify-between font-mono text-[10px] text-faint">
              <span>{lim.min}°</span>
              <span>{lim.max}°</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
