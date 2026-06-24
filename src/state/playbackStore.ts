import { create } from 'zustand'

/**
 * Program playback store — Phase 4 · Unit 3.
 *
 * Tracks *where* playback is in the active program (driven by
 * `program/useProgramPlayback.ts`), separate from the program's data
 * (`programStore`) and motion/safety state (`machineStore`). `currentIndex` is
 * both "next instruction to run" (stopped) and "instruction in flight"
 * (running) — the editor highlights it as the active line either way.
 */
interface PlaybackStore {
  running: boolean
  currentIndex: number
  loop: boolean
  /** Human-readable reason the last run halted (cleared at the start of each instruction). */
  lastError: string | null
  setRunning: (running: boolean) => void
  setCurrentIndex: (index: number) => void
  toggleLoop: () => void
  setLastError: (reason: string | null) => void
  /** Stop: halt and rewind to the first instruction. */
  reset: () => void
}

export const usePlaybackStore = create<PlaybackStore>((set) => ({
  running: false,
  currentIndex: 0,
  loop: false,
  lastError: null,
  setRunning: (running) => set({ running }),
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  toggleLoop: () => set((s) => ({ loop: !s.loop })),
  setLastError: (lastError) => set({ lastError }),
  reset: () => set({ running: false, currentIndex: 0, lastError: null }),
}))
