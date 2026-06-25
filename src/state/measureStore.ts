import { create } from 'zustand'

/**
 * Measure tool store.
 *
 * A simple two-point ruler for the 3D scene: click a point on the model, click
 * a second, and read the straight-line distance — used to measure the actual
 * GLB's link lengths and compare them against the locked DH table (the GLB↔FK
 * geometry mismatch is a known carried-forward issue — progress-tracker.md).
 *
 * Points are scene-space world coordinates (metres, Y-up); the readout converts
 * to mm and to the FK/DH frame. A third click after two points are set starts a
 * fresh measurement; toggling the tool off clears the points.
 */
type ScenePoint = [number, number, number]

interface MeasureStore {
  active: boolean
  points: ScenePoint[]
  toggleActive: () => void
  addPoint: (p: ScenePoint) => void
  clear: () => void
}

export const useMeasureStore = create<MeasureStore>((set) => ({
  active: false,
  points: [],
  toggleActive: () => set((s) => ({ active: !s.active, points: s.active ? [] : s.points })),
  addPoint: (p) => set((s) => ({ points: s.points.length >= 2 ? [p] : [...s.points, p] })),
  clear: () => set({ points: [] }),
}))
