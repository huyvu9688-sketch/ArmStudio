import { mm2m } from '../kinematics/units'

/**
 * FK→scene frame mapping — shared by `TcpTrail` and `CameraRig` (Phase 5 ·
 * Unit 7). FK works in a Z-up DH base frame (mm); the three.js scene is Y-up
 * (m). The mapping is a −90° rotation about X: (x, y, z)_fk → (x, z, −y)_scene
 * — see architecture.md's "Scene coordinate mapping".
 */
export function sceneFromFk(xMm: number, yMm: number, zMm: number): [number, number, number] {
  return [mm2m(xMm), mm2m(zMm), mm2m(-yMm)]
}
