import { m2mm, mm2m } from '../kinematics/units'
import type { JointAxis } from '../types'

/**
 * FK→scene frame mapping — shared by `TcpTrail` and `CameraRig` (Phase 5 ·
 * Unit 7). FK works in a Z-up DH base frame (mm); the three.js scene is Y-up
 * (m). The mapping is a −90° rotation about X: (x, y, z)_fk → (x, z, −y)_scene
 * — see architecture.md's "Scene coordinate mapping".
 */
export function sceneFromFk(xMm: number, yMm: number, zMm: number): [number, number, number] {
  return [mm2m(xMm), mm2m(zMm), mm2m(-yMm)]
}

/**
 * Inverse of `sceneFromFk`: scene point (m, Y-up) → FK-frame mm (Z-up). Lets
 * the measure tool report axis deltas in the same frame as the DH table, so a
 * caliper-style measurement of the GLB lines up with the locked DH a/d values.
 */
export function fkFromScene(xM: number, yM: number, zM: number): [number, number, number] {
  return [m2mm(xM), m2mm(-zM), m2mm(yM)]
}

/**
 * Which scene-space array index (and sign) a given FK/DH axis varies along,
 * per the same −90° X mapping: fk.x → scene[0], fk.y → −scene[2], fk.z → scene[1].
 * Lets the measure tool draw an axis-locked segment (vary only that scene
 * coordinate between the two points) instead of the raw diagonal between two
 * arbitrary clicks — a true single-axis caliper reading against the DH table.
 */
export const FK_AXIS_TO_SCENE: Record<JointAxis, { index: 0 | 1 | 2; sign: 1 | -1 }> = {
  x: { index: 0, sign: 1 },
  y: { index: 2, sign: -1 },
  z: { index: 1, sign: 1 },
}
