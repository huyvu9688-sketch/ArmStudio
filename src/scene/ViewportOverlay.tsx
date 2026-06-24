import { Eraser, Spline } from 'lucide-react'
import { useSettingsStore, type CameraView } from '../state/settingsStore'

/**
 * Viewport overlay — Phase 3 · Unit 6 (trail) + Phase 5 · Unit 7 (camera views).
 *
 * HTML controls floating over the 3D canvas (kept outside the r3f Canvas): the
 * TCP trail toggle/clear, and the camera view presets that `CameraRig` reacts
 * to. Future view controls (DH-frame toggle) join here in Phase 6.
 */
const CAMERA_VIEWS: { id: CameraView; label: string }[] = [
  { id: 'orbit', label: 'Orbit' },
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Side' },
  { id: 'top', label: 'Top' },
  { id: 'tcp', label: 'TCP' },
]

export function ViewportOverlay() {
  const showTrail = useSettingsStore((s) => s.showTrail)
  const toggleTrail = useSettingsStore((s) => s.toggleTrail)
  const clearTrail = useSettingsStore((s) => s.clearTrail)
  const cameraView = useSettingsStore((s) => s.cameraView)
  const setCameraView = useSettingsStore((s) => s.setCameraView)

  return (
    <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5">
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-md border border-border-default bg-surface/80 p-0.5">
        {CAMERA_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setCameraView(v.id)}
            aria-pressed={cameraView === v.id}
            title={v.id === 'tcp' ? 'Orbit around the live TCP' : `${v.label} view`}
            className={[
              'rounded-sm px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide transition-colors',
              cameraView === v.id
                ? 'bg-amber text-[color:var(--bg-base)]'
                : 'text-muted hover:text-primary',
            ].join(' ')}
          >
            {v.label}
          </button>
        ))}
      </div>
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
