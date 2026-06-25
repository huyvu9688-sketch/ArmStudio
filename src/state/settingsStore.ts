import { create } from 'zustand'

/**
 * View/settings store — Phase 3 · Unit 6.
 *
 * Non-robot UI preferences for the scene. Starts with the TCP motion trail
 * toggle (Roboguide's path trace); `showDhFrames` (Phase 6 · Unit 1) joins it.
 * `clearTrailNonce` is a bump counter the trail component watches to reset
 * its buffer (it owns the geometry imperatively).
 */
/** Camera presets (Phase 5 · Unit 7). 'tcp' continuously re-centers on the live TCP. */
export type CameraView = 'orbit' | 'front' | 'side' | 'top' | 'tcp'

interface SettingsStore {
  showTrail: boolean
  setShowTrail: (v: boolean) => void
  toggleTrail: () => void
  clearTrailNonce: number
  clearTrail: () => void
  /** Program editor drawer (ui-context.md: opens as a right-side drawer/overlay). */
  programEditorOpen: boolean
  toggleProgramEditor: () => void
  cameraView: CameraView
  /** Bumped on every `setCameraView` call so `CameraRig` re-snaps even when re-selecting the same preset. */
  cameraSnapNonce: number
  setCameraView: (view: CameraView) => void
  /** Per-joint DH coordinate frame gizmos (Phase 6 · Unit 1). */
  showDhFrames: boolean
  toggleDhFrames: () => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  showTrail: true,
  setShowTrail: (showTrail) => set({ showTrail }),
  toggleTrail: () => set((s) => ({ showTrail: !s.showTrail })),
  clearTrailNonce: 0,
  clearTrail: () => set((s) => ({ clearTrailNonce: s.clearTrailNonce + 1 })),
  programEditorOpen: false,
  toggleProgramEditor: () => set((s) => ({ programEditorOpen: !s.programEditorOpen })),
  cameraView: 'orbit',
  cameraSnapNonce: 0,
  setCameraView: (view) => set((s) => ({ cameraView: view, cameraSnapNonce: s.cameraSnapNonce + 1 })),
  showDhFrames: false,
  toggleDhFrames: () => set((s) => ({ showDhFrames: !s.showDhFrames })),
}))
