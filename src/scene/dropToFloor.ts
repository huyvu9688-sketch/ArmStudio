import * as THREE from 'three'
import { activeCameraRef } from './activeCamera'

/**
 * Raycast a viewport drop position onto the floor plane (y = 0) — the actual
 * "drag to place" from code-standards.md's Cell/Scene section. Returns the hit
 * point in mm (the scene's Y-up convention `CellObjects.tsx` already uses for
 * `transform.position`, not the FK Z-up frame), or null if the camera isn't
 * ready yet or the drop ray is parallel to the floor.
 */
export function dropPointOnFloor(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
): { x: number; y: number; z: number } | null {
  const camera = activeCameraRef.current
  if (!camera) return null

  const rect = canvas.getBoundingClientRect()
  const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1
  const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera)

  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const point = new THREE.Vector3()
  if (!raycaster.ray.intersectPlane(floor, point)) return null

  return { x: point.x * 1000, y: 0, z: point.z * 1000 }
}
