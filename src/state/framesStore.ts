import { create } from 'zustand'
import { createFrame } from '../frames/framesModel'
import type { Frame, Pose } from '../types'

/**
 * Frames store — Phase 5 · Unit 6.
 *
 * Registered tool and user frames plus which one is active. `null` active id
 * means the un-offset default (tool0 for tools, the world base for users) —
 * no seed frame needed, matching the zero-offset identity. `useJog.ts` reads
 * the active frame's offset to orient Cartesian jog axes; `FrameSelector`
 * reads it to enable the User tab.
 */
interface FramesStore {
  toolFrames: Frame[]
  userFrames: Frame[]
  activeToolFrameId: string | null
  activeUserFrameId: string | null
  addToolFrame: (name: string) => void
  addUserFrame: (name: string) => void
  updateToolFrame: (id: string, offset: Pose) => void
  updateUserFrame: (id: string, offset: Pose) => void
  removeToolFrame: (id: string) => void
  removeUserFrame: (id: string) => void
  setActiveToolFrame: (id: string | null) => void
  setActiveUserFrame: (id: string | null) => void
}

export const useFramesStore = create<FramesStore>((set) => ({
  toolFrames: [],
  userFrames: [],
  activeToolFrameId: null,
  activeUserFrameId: null,
  addToolFrame: (name) => set((s) => ({ toolFrames: [...s.toolFrames, createFrame(name)] })),
  addUserFrame: (name) => set((s) => ({ userFrames: [...s.userFrames, createFrame(name)] })),
  updateToolFrame: (id, offset) =>
    set((s) => ({ toolFrames: s.toolFrames.map((f) => (f.id === id ? { ...f, offset } : f)) })),
  updateUserFrame: (id, offset) =>
    set((s) => ({ userFrames: s.userFrames.map((f) => (f.id === id ? { ...f, offset } : f)) })),
  removeToolFrame: (id) =>
    set((s) => ({
      toolFrames: s.toolFrames.filter((f) => f.id !== id),
      activeToolFrameId: s.activeToolFrameId === id ? null : s.activeToolFrameId,
    })),
  removeUserFrame: (id) =>
    set((s) => ({
      userFrames: s.userFrames.filter((f) => f.id !== id),
      activeUserFrameId: s.activeUserFrameId === id ? null : s.activeUserFrameId,
    })),
  setActiveToolFrame: (id) => set({ activeToolFrameId: id }),
  setActiveUserFrame: (id) => set({ activeUserFrameId: id }),
}))

/** The active tool frame's offset, or zero if none is selected. */
export function activeToolOffset(s: FramesStore): Pose {
  return s.toolFrames.find((f) => f.id === s.activeToolFrameId)?.offset ?? ZERO_POSE
}

/** The active user frame's offset, or zero if none is selected. */
export function activeUserOffset(s: FramesStore): Pose {
  return s.userFrames.find((f) => f.id === s.activeUserFrameId)?.offset ?? ZERO_POSE
}

const ZERO_POSE: Pose = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 }
