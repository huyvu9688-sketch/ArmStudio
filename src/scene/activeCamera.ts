import type { Camera } from 'three'

/**
 * Live camera handle — Phase 5 · Unit 2 follow-up (drag-to-place).
 *
 * `App.tsx`'s drop handler lives outside the r3f `Canvas` (native HTML drag-
 * and-drop isn't part of r3f's pointer event system), but needs the active
 * camera to raycast a dropped file onto the floor. `CameraRig` (inside the
 * Canvas) keeps this updated; nothing else should write to it.
 */
export const activeCameraRef: { current: Camera | null } = { current: null }
