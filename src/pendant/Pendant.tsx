import { usePendantStore } from '../state/pendantStore'
import { CartesianJog } from './CartesianJog'
import { FramePanel } from '../frames/FramePanel'
import { FrameSelector } from './FrameSelector'
import { GoToPose } from './GoToPose'
import { JointJog } from './JointJog'
import { KinematicsReadout } from './KinematicsReadout'
import { PoseReadout } from './PoseReadout'
import { SafetyControls } from './SafetyControls'
import { SpeedOverride } from './SpeedOverride'

/**
 * Teach pendant — Phases 2–3, frames in Phase 5 · Unit 6.
 *
 * The full iPendant-style panel composed from its sections, in the ui-context.md
 * layout order: frame selector, the jog grid (joint J1–J6, or the Cartesian
 * X/Y/Z/Rx/Ry/Rz grid in World/Tool/User frames — both are drag-the-bar or
 * click-to-edit-exact-value, no held jog), speed override, live TCP pose +
 * manipulability, "go to pose", tool/user frame registration, and the safety
 * controls. Each section is its own presentational module; shared state lives
 * in the pendant / machine / robot / frames stores.
 */
function Divider() {
  return <div className="h-px bg-border-default" />
}

export function Pendant() {
  const frame = usePendantStore((s) => s.activeFrame)
  const cartesian = frame === 'world' || frame === 'tool' || frame === 'user'

  return (
    <div className="flex flex-col gap-3">
      <FrameSelector />
      <Divider />
      {cartesian ? <CartesianJog /> : <JointJog />}
      <SpeedOverride />
      <Divider />
      <PoseReadout />
      <KinematicsReadout />
      <Divider />
      <GoToPose />
      <Divider />
      <FramePanel />
      <Divider />
      <SafetyControls />
    </div>
  )
}
