import { Fragment, useMemo } from 'react'
import { forwardKinematics } from '../kinematics/forward'
import { useRobotStore } from '../state/robotStore'

/**
 * Live TCP pose readout — Phase 1 · Unit 8.
 *
 * Reads the joint angles from the robot store and shows the forward-kinematics
 * TCP pose: position (mm) and orientation (deg, XYZ Euler). Recomputes on every
 * jog. Numeric readouts use the mono font (ui-context.md). Presentational —
 * the kinematics lives in src/kinematics.
 */
export function PoseReadout() {
  const angles = useRobotStore((s) => s.angles)
  const pose = useMemo(() => forwardKinematics(angles), [angles])

  const rows: [string, number, string, string, number][] = [
    ['X', pose.x, 'mm', 'Rx', pose.rx],
    ['Y', pose.y, 'mm', 'Ry', pose.ry],
    ['Z', pose.z, 'mm', 'Rz', pose.rz],
  ]

  return (
    <div>
      <h3 className="text-faint mb-1.5 text-[11px] font-semibold uppercase tracking-widest">
        TCP Pose
      </h3>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-md border border-border-default bg-well p-2 font-mono text-xs">
        {rows.map(([lin, linVal, unit, ang, angVal]) => (
          <Fragment key={lin}>
            <div className="flex items-baseline justify-between">
              <span className="text-muted">{lin}</span>
              <span className="text-primary">
                {linVal.toFixed(1)}
                <span className="text-faint"> {unit}</span>
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-muted">{ang}</span>
              <span className="text-primary">
                {angVal.toFixed(1)}
                <span className="text-faint">°</span>
              </span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
