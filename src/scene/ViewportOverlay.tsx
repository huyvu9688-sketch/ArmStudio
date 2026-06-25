import type { ReactNode } from 'react'
import { Axis3D, Eraser, Ruler, Spline } from 'lucide-react'
import { useSettingsStore, type CameraView } from '../state/settingsStore'
import { useMeasureStore } from '../state/measureStore'
import { fkFromScene, FK_AXIS_TO_SCENE } from './sceneFrame'
import { SCENE_COLORS } from './colors'

/** Scene-index-ordered axis colors, matching AxisTriad/MeasureTool's staircase. */
const SCENE_AXIS_COLORS = [SCENE_COLORS.axisX, SCENE_COLORS.axisY, SCENE_COLORS.axisZ]

/**
 * Viewport overlay — Phase 3 · Unit 6 (trail) + Phase 5 · Unit 7 (camera views)
 * + measure tool + Phase 6 · Unit 1 (DH frames).
 *
 * HTML controls floating over the 3D canvas (kept outside the r3f Canvas): the
 * TCP trail toggle/clear, the camera view presets that `CameraRig` reacts to,
 * the two-point measure tool (toggle + live distance readout), and the DH
 * coordinate frame toggle (`DhFrameGizmos` reacts to `settingsStore.showDhFrames`).
 * Remaining Phase 6 controls (work envelope, reach test, singularity map) join
 * here in their own units.
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
  const measureActive = useMeasureStore((s) => s.active)
  const toggleMeasure = useMeasureStore((s) => s.toggleActive)
  const showDhFrames = useSettingsStore((s) => s.showDhFrames)
  const toggleDhFrames = useSettingsStore((s) => s.toggleDhFrames)

  return (
    <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
      <div className="flex items-center gap-1.5">
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
        <button
          type="button"
          onClick={toggleMeasure}
          aria-pressed={measureActive}
          title="Measure distance between two points on the model"
          className={[
            'pointer-events-auto inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide transition-colors',
            measureActive
              ? 'border-amber bg-amber text-[color:var(--bg-base)]'
              : 'border-border-default bg-surface/80 text-muted hover:border-border-emphasis hover:text-primary',
          ].join(' ')}
        >
          <Ruler size={14} strokeWidth={2.5} />
          Measure
        </button>
        <button
          type="button"
          onClick={toggleDhFrames}
          aria-pressed={showDhFrames}
          title="Toggle per-joint DH coordinate frames"
          className={[
            'pointer-events-auto inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide transition-colors',
            showDhFrames
              ? 'border-amber bg-amber text-[color:var(--bg-base)]'
              : 'border-border-default bg-surface/80 text-muted hover:border-border-emphasis hover:text-primary',
          ].join(' ')}
        >
          <Axis3D size={14} strokeWidth={2.5} />
          DH Frames
        </button>
      </div>

      {measureActive && <MeasureReadout />}
    </div>
  )
}

function MeasureReadout() {
  const points = useMeasureStore((s) => s.points)
  const clear = useMeasureStore((s) => s.clear)

  let body: ReactNode
  if (points.length === 0) {
    body = <span className="text-faint">Click a point on the arm…</span>
  } else if (points.length === 1) {
    body = <span className="text-faint">Click a second point…</span>
  } else {
    const [a, b] = points
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const dz = b[2] - a[2]
    const dist = Math.hypot(dx, dy, dz) * 1000
    // Per-axis deltas in the FK/DH frame (mm), so they line up with the DH table.
    const [fdx, fdy, fdz] = fkFromScene(dx, dy, dz)
    const deltas: Record<'x' | 'y' | 'z', number> = { x: fdx, y: fdy, z: fdz }
    body = (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-faint">Distance</span>
          <span className="text-amber tabular-nums">{dist.toFixed(1)} mm</span>
        </div>
        <div className="flex justify-between gap-3 tabular-nums">
          {(['x', 'y', 'z'] as const).map((k) => (
            <span key={k} style={{ color: SCENE_AXIS_COLORS[FK_AXIS_TO_SCENE[k].index] }}>
              Δ{k.toUpperCase()} {deltas[k].toFixed(1)}
            </span>
          ))}
        </div>
        <span className="text-faint text-[9px] uppercase tracking-wide">DH frame · mm</span>
      </div>
    )
  }

  return (
    <div className="pointer-events-auto flex flex-col gap-1.5 rounded-md border border-border-default bg-surface/90 px-2.5 py-1.5 font-mono text-[11px]">
      {body}
      <button
        type="button"
        onClick={clear}
        className="text-faint self-start text-[10px] uppercase tracking-wide hover:text-primary"
      >
        Reset points
      </button>
    </div>
  )
}
