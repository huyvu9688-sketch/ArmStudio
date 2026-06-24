import { JOINT_LIMITS } from '../config/dh-params'
import { GLB_JOINT_MAP } from '../config/glb-joint-map'
import { useMachineStore } from '../state/machineStore'
import { useRobotStore } from '../state/robotStore'
import { JogButton } from '../ui/JogButton'
import { JointBar } from '../ui/JointBar'
import { useJog } from './useJog'

/**
 * Joint jog grid — Phase 2 · Unit 2.
 *
 * Replaces the Unit-7 sliders with FANUC-style +/- jog buttons, one pair per
 * joint, driven through `useJog` (continuous hold-to-jog or incremental step,
 * per the pendant store; clamped to JOINT_LIMITS). Keeps the limit information
 * as a JointBar plus min/max labels. Buttons disable while E-STOP/HOLD block
 * motion. Presentational — no kinematics here (code-standards.md).
 *
 * On the current 4-DOF model J4/J6 have no GLB pivot, so they drive the store /
 * FK pose but not the mesh — flagged inline.
 */
export function JointJog() {
  const angles = useRobotStore((s) => s.angles)
  const motionEnabled = useMachineStore((s) => !s.estop && !s.hold)
  const { startJointJog, stopJog } = useJog()

  return (
    <div className="flex flex-col gap-2">
      {JOINT_LIMITS.map((lim, i) => {
        const noPivot = GLB_JOINT_MAP[i].node === null
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-baseline justify-between font-mono text-xs">
                <span className="text-primary">
                  J{i + 1}
                  {noPivot && <span className="text-faint"> · no pivot</span>}
                </span>
                <span className="text-amber tabular-nums">{angles[i].toFixed(1)}°</span>
              </div>
              <JointBar value={angles[i]} min={lim.min} max={lim.max} />
              <div className="flex justify-between font-mono text-[10px] text-faint">
                <span>{lim.min}°</span>
                <span>{lim.max}°</span>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <JogButton
                direction={-1}
                disabled={!motionEnabled}
                ariaLabel={`Jog J${i + 1} negative`}
                onJogStart={() => startJointJog(i, -1)}
                onJogStop={stopJog}
              />
              <JogButton
                direction={1}
                disabled={!motionEnabled}
                ariaLabel={`Jog J${i + 1} positive`}
                onJogStart={() => startJointJog(i, 1)}
                onJogStop={stopJog}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
