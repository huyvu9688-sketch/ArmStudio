import { create } from 'zustand'

/**
 * View/settings store — Phase 3 · Unit 6.
 *
 * Non-robot UI preferences for the scene. Starts with the TCP motion trail
 * toggle (Roboguide's path trace); DH-frame and envelope toggles join it in the
 * study-tools phase (Phase 6). `clearTrailNonce` is a bump counter the trail
 * component watches to reset its buffer (it owns the geometry imperatively).
 */
interface SettingsStore {
  showTrail: boolean
  setShowTrail: (v: boolean) => void
  toggleTrail: () => void
  clearTrailNonce: number
  clearTrail: () => void
  /** Program editor drawer (ui-context.md: opens as a right-side drawer/overlay). */
  programEditorOpen: boolean
  toggleProgramEditor: () => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  showTrail: true,
  setShowTrail: (showTrail) => set({ showTrail }),
  toggleTrail: () => set((s) => ({ showTrail: !s.showTrail })),
  clearTrailNonce: 0,
  clearTrail: () => set((s) => ({ clearTrailNonce: s.clearTrailNonce + 1 })),
  programEditorOpen: false,
  toggleProgramEditor: () => set((s) => ({ programEditorOpen: !s.programEditorOpen })),
}))
