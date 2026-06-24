import { STEP_SIZES, usePendantStore } from '../state/pendantStore'
import { FrameTab } from '../ui/FrameTab'

/**
 * Jog mode + step selector — Phase 2 · Unit 3.
 *
 * Toggles continuous (hold-to-jog) vs. incremental (one step per press), and
 * picks the incremental step size. The step chips are only meaningful in
 * incremental mode, so they disable in continuous mode.
 */
export function JogModeSelector() {
  const jogMode = usePendantStore((s) => s.jogMode)
  const setJogMode = usePendantStore((s) => s.setJogMode)
  const stepSize = usePendantStore((s) => s.stepSize)
  const setStepSize = usePendantStore((s) => s.setStepSize)
  const incremental = jogMode === 'incremental'

  return (
    <div className="flex flex-col gap-1">
      <span className="text-faint text-[11px] font-semibold uppercase tracking-widest">Mode</span>
      <div className="flex flex-wrap items-center gap-1">
        <FrameTab
          label="Cont"
          active={!incremental}
          onClick={() => setJogMode('continuous')}
        />
        <FrameTab
          label="Incr"
          active={incremental}
          onClick={() => setJogMode('incremental')}
        />
        <span className="text-faint ml-1.5 text-[10px] font-semibold uppercase tracking-widest">
          Step
        </span>
        {STEP_SIZES.map((s) => (
          <FrameTab
            key={s}
            label={`${s}°`}
            active={incremental && stepSize === s}
            disabled={!incremental}
            className="px-2"
            onClick={() => setStepSize(s)}
          />
        ))}
      </div>
    </div>
  )
}
