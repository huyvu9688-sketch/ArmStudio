import { create } from 'zustand'

/**
 * Measure tool store.
 *
 * A two-point ruler for the 3D scene: click a point on the model, click a
 * second, and read the distance plus its X/Y/Z components — used to measure
 * the actual GLB's link lengths and compare them against the locked DH table
 * (the GLB↔FK geometry mismatch is a known carried-forward issue —
 * progress-tracker.md). All three axis deltas are always shown together
 * (CAD-measure-tool style: direct distance + dX/dY/dZ simultaneously), not
 * gated behind a lock — see `MeasureTool.tsx` for the axis-colored segments.
 *
 * Points are scene-space world coordinates (metres, Y-up); the readout
 * converts to mm and to the FK/DH frame. A third click after two points are
 * set starts a fresh measurement; toggling the tool off clears the points.
 *
 * `hoverFace`: the exact triangle (3 world-space vertices) the raycast last
 * hit, set by `RobotArm` on pointermove while active. Rendered as a small
 * overlay in `MeasureTool` so you see precisely which face you're about to
 * click — the GLB's links are single meshes with many faces, so highlighting
 * the whole mesh object (the first cut at this) didn't pin down a face.
 */
type ScenePoint = [number, number, number]
type ScenePoint3 = [ScenePoint, ScenePoint, ScenePoint]

interface MeasureStore {
  active: boolean
  points: ScenePoint[]
  hoverFace: ScenePoint3 | null
  toggleActive: () => void
  addPoint: (p: ScenePoint) => void
  setHoverFace: (face: ScenePoint3 | null) => void
  clear: () => void
}

export const useMeasureStore = create<MeasureStore>((set) => ({
  active: false,
  points: [],
  hoverFace: null,
  toggleActive: () => set((s) => ({ active: !s.active, points: s.active ? [] : s.points, hoverFace: null })),
  addPoint: (p) => set((s) => ({ points: s.points.length >= 2 ? [p] : [...s.points, p] })),
  setHoverFace: (hoverFace) => set({ hoverFace }),
  clear: () => set({ points: [] }),
}))
