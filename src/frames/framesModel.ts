import type { Frame, Pose } from '../types'

/**
 * Frame model — Phase 5 · Unit 6 (pure, no React/three/DOM).
 *
 * Tool/user frames are direct-entry only for now (the 3-point capture method
 * from project-overview.md is a documented gap — see progress-tracker.md).
 */
export const ZERO_OFFSET: Pose = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 }

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export function createFrame(name: string, offset: Pose = ZERO_OFFSET): Frame {
  return { id: genId('frame'), name, offset }
}
