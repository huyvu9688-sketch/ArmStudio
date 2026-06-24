import { Eraser, Spline } from 'lucide-react'
import { useSettingsStore } from '../state/settingsStore'

/**
 * Viewport overlay — Phase 3 · Unit 6.
 *
 * HTML controls floating over the 3D canvas (kept outside the r3f Canvas). For
 * now: the TCP trail toggle and a Clear button. Future view controls (camera
 * presets, DH-frame toggle) join here. Rendered in the App's viewport region.
 */
export function ViewportOverlay() {
  const showTrail = useSettingsStore((s) => s.showTrail)
  const toggleTrail = useSettingsStore((s) => s.toggleTrail)
  const clearTrail = useSettingsStore((s) => s.clearTrail)

  return (
    <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggleTrail}
        aria-pressed={showTrail}
        title="Toggle TCP motion trail"
        className={[
          'pointer-events-auto inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide transition-colors',
          showTrail
            ? 'border-amber bg-amber text-[color:var(--bg-base)]'
            : 'border-border-default bg-surface/80 text-muted hover:border-border-emphasis hover:text-primary',
        ].join(' ')}
      >
        <Spline size={14} strokeWidth={2.5} />
        Trail
      </button>
      <button
        type="button"
        onClick={clearTrail}
        title="Clear the TCP trail"
        className="pointer-events-auto inline-flex items-center gap-1.5 rounded-md border border-border-default bg-surface/80 px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-muted transition-colors hover:border-border-emphasis hover:text-primary"
      >
        <Eraser size={14} strokeWidth={2.5} />
        Clear
      </button>
    </div>
  )
}
