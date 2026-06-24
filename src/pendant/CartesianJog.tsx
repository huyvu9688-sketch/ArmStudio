import { useMemo } from 'react'
import { forwardKinematics } from '../kinematics/forward'
import { useMachineStore } from '../state/machineStore'
import { usePendantStore } from '../state/pendantStore'
import { useRobotStore } from '../state/robotStore'
import { JogButton } from '../ui/JogButton'
import { useJog } from './useJog'

/**
 * Cartesian jog grid — Phase 3 · Unit 3.
 *
 * Shown when the active frame is World or Tool. Jogs the TCP along X/Y/Z (mm) and
 * Rx/Ry/Rz (deg) by solving IK each frame (continuous hold-to-jog). The live
 * value column shows the current TCP pose so the user can read the move. Joint
 * limits and singularities are handled inside IK — if a direction can't be
 * followed the jog simply stops.
 *
 * Continuous only here; incremental Cartesian steps arrive with the programmer
 * in Phase 4. Buttons disable while E-STOP/HOLD block motion.
 */
const AXES: { axis: number; label: string; unit: string; key: keyof ReturnType<typeof forwardKinematics> }[] = [
  { axis: 0, label: 'X', unit: 'mm', key: 'x' },
  { axis: 1, label: 'Y', unit: 'mm', key: 'y' },
  { axis: 2, label: 'Z', unit: 'mm', key: 'z' },
  { axis: 3, label: 'Rx', unit: '°', key: 'rx' },
  { axis: 4, label: 'Ry', unit: '°', key: 'ry' },
  { axis: 5, label: 'Rz', unit: '°', key: 'rz' },
]

export function CartesianJog() {
  const angles = useRobotStore((s) => s.angles)
  const frame = usePendantStore((s) => s.activeFrame)
  const motionEnabled = useMachineStore((s) => !s.estop && !s.hold)
  const { startCartesianJog, stopJog } = useJog()
  const pose = useMemo(() => forwardKinematics(angles), [angles])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-faint text-[11px] font-semibold uppercase tracking-widest">
          {frame === 'tool' ? 'Tool jog' : 'World jog'}
        </span>
        <span className="text-faint font-mono text-[10px]">TCP via IK</span>
      </div>
      {AXES.map(({ axis, label, unit, key }) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-baseline justify-between font-mono text-xs">
            <span className="text-primary">{label}</span>
            <span className="text-amber tabular-nums">
              {pose[key].toFixed(1)}
              <span className="text-faint"> {unit}</span>
            </span>
          </div>
          <div className="flex shrink-0 gap-1">
            <JogButton
              direction={-1}
              disabled={!motionEnabled}
              ariaLabel={`Jog ${label} negative`}
              onJogStart={() => startCartesianJog(axis, -1)}
              onJogStop={stopJog}
            />
            <JogButton
              direction={1}
              disabled={!motionEnabled}
              ariaLabel={`Jog ${label} positive`}
              onJogStart={() => startCartesianJog(axis, 1)}
              onJogStop={stopJog}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
