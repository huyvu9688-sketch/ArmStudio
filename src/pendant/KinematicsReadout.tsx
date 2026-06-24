import { useMemo } from 'react'
import { manipulabilityRatio, SINGULARITY_WARN_RATIO } from '../kinematics/jacobian'
import { useRobotStore } from '../state/robotStore'

/**
 * Kinematics readout — Phase 3 · Unit 3.
 *
 * Live manipulability (Yoshikawa index, normalised to a well-conditioned
 * reference config) with a bar and a singularity warning. Manipulability → 0 as
 * the arm approaches a singularity, where Cartesian jog and MOVL lose a DOF; the
 * bar turns red and flags "NEAR SINGULARITY" below the warn threshold. Pure read
 * of the robot store; the math lives in src/kinematics.
 */
export function KinematicsReadout() {
  const angles = useRobotStore((s) => s.angles)
  const ratio = useMemo(() => manipulabilityRatio(angles), [angles])
  const near = ratio < SINGULARITY_WARN_RATIO
  const fillPct = Math.min(100, Math.max(0, ratio * 100))
  const color = near ? 'var(--state-error)' : 'var(--accent-blue)'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-faint text-[11px] font-semibold uppercase tracking-widest">
          Manipulability
        </span>
        <span className="font-mono text-xs tabular-nums" style={{ color }}>
          {(ratio * 100).toFixed(0)}%
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-well">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${fillPct}%`, background: color }}
        />
      </div>
      {near && (
        <span className="text-error font-mono text-[10px] font-semibold uppercase tracking-wide">
          ⚠ Near singularity
        </span>
      )}
    </div>
  )
}
