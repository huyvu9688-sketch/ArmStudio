import { useMachineStore } from '../state/machineStore'
import { useRobotStore } from '../state/robotStore'
import { PendantButton } from '../ui/PendantButton'

/**
 * Safety controls — Phase 2 · Unit 4.
 *
 * TEACH / HOME / HOLD plus the latched E-STOP.
 *  - HOME jogs the arm back to the home pose (blocked while motion is disabled).
 *  - HOLD toggles a motion hold that pauses jogging/playback.
 *  - E-STOP latches: pressing it kills motion and stays engaged until an explicit
 *    Reset (a deliberate two-step, like a real machine — no accidental clear).
 * TEACH records a waypoint; it lands with the offline programmer in Phase 4 and
 * is shown disabled until then.
 */
export function SafetyControls() {
  const estop = useMachineStore((s) => s.estop)
  const hold = useMachineStore((s) => s.hold)
  const engageEstop = useMachineStore((s) => s.engageEstop)
  const resetEstop = useMachineStore((s) => s.resetEstop)
  const toggleHold = useMachineStore((s) => s.toggleHold)
  const home = useRobotStore((s) => s.home)

  const motionEnabled = !estop && !hold

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <PendantButton disabled title="Teach a waypoint — Phase 4">
          Teach
        </PendantButton>
        <PendantButton disabled={!motionEnabled} onClick={home}>
          Home
        </PendantButton>
        <PendantButton variant="amber" active={hold} disabled={estop} onClick={toggleHold}>
          {hold ? 'Hold ●' : 'Hold'}
        </PendantButton>
      </div>

      {/* E-STOP — latched. Engage on press; clear only via the explicit Reset. */}
      {!estop ? (
        <button
          type="button"
          onClick={engageEstop}
          className="select-none rounded-full border-2 border-error bg-surface-2 py-3 text-sm font-bold uppercase tracking-[0.2em] text-error transition-colors hover:bg-error hover:text-primary"
        >
          ⏹ E-Stop
        </button>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="animate-pulse select-none rounded-full border-2 border-error bg-error py-3 text-center text-sm font-bold uppercase tracking-[0.2em] text-primary">
            ⏹ E-Stop Engaged
          </div>
          <PendantButton variant="ready" className="w-full" onClick={resetEstop}>
            Reset E-Stop
          </PendantButton>
        </div>
      )}
    </div>
  )
}
