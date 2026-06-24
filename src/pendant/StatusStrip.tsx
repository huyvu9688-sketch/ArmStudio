import { deriveStatus, useMachineStore, type RobotStatus } from '../state/machineStore'
import { usePendantStore } from '../state/pendantStore'
import { StatusPill, type StatusTone } from '../ui/StatusPill'

/**
 * Status strip — Phase 2 · Unit 5.
 *
 * The full-width top HUD, now wired live (it was static in Phase 1). Surfaces the
 * active frame and speed override (pendant store) and the robot status pill
 * (machine store), with placeholders for program name (Phase 4) and the
 * connection pill (Offline until Phase 7). Numeric/telemetry text is monospaced
 * per ui-context.md.
 */
const STATUS_META: Record<RobotStatus, { label: string; tone: StatusTone; pulse?: boolean }> = {
  ready: { label: 'Ready', tone: 'ready' },
  moving: { label: 'Moving', tone: 'moving', pulse: true },
  hold: { label: 'Hold', tone: 'hold' },
  estop: { label: 'E-Stop', tone: 'error', pulse: true },
}

export function StatusStrip() {
  const activeFrame = usePendantStore((s) => s.activeFrame)
  const speedPct = usePendantStore((s) => s.speedPct)
  const status = useMachineStore(deriveStatus)
  const meta = STATUS_META[status]

  return (
    <header className="flex h-10 shrink-0 items-center justify-between border-b border-border-default bg-surface px-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tracking-wide">ArmStudio</span>
        <span className="text-faint">/</span>
        <span className="text-muted text-sm">offline programmer</span>
      </div>
      <div className="flex items-center gap-5 font-mono text-xs">
        <span className="text-muted">
          FRAME <span className="text-amber uppercase">{activeFrame}</span>
        </span>
        <span className="text-muted">
          SPEED <span className="text-primary tabular-nums">{speedPct}%</span>
        </span>
        <span className="text-muted">
          PROG <span className="text-faint">(none)</span>
        </span>
        <StatusPill label={meta.label} tone={meta.tone} pulse={meta.pulse} />
        <StatusPill label="Offline" tone="offline" />
      </div>
    </header>
  )
}
