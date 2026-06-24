import * as THREE from 'three'

/**
 * Geometry cache — Phase 5 · Unit 2.
 *
 * `CellObject` (the serializable record in `cellStore`) deliberately holds no
 * three.js object (types.ts: "the actual `BufferGeometry`/`Group` ... is never
 * serialized into this record"). The loaded geometry lives here instead,
 * keyed by `CellObject.id`, so the scene can look it up by id while the store
 * stays plain data. Not a zustand store — three.js objects aren't meant to
 * flow through React state diffing.
 */
export type CadGeometry = THREE.BufferGeometry | THREE.Object3D

const cache = new Map<string, CadGeometry>()

export function setCadGeometry(id: string, geometry: CadGeometry): void {
  cache.set(id, geometry)
}

export function getCadGeometry(id: string): CadGeometry | undefined {
  return cache.get(id)
}

/** Free GPU resources for a removed object (code-standards.md: dispose on removal). */
export function disposeCadGeometry(id: string): void {
  const geometry = cache.get(id)
  if (!geometry) return

  if (geometry instanceof THREE.BufferGeometry) {
    geometry.dispose()
  } else {
    geometry.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((m) => m.dispose())
      }
    })
  }
  cache.delete(id)
}
