import { useEffect, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import { TransformControls } from '@react-three/drei'
import { useCellStore } from '../cell/cellStore'
import { getCadGeometry } from '../cad/geometryCache'
import type { CellObject } from '../types'

/**
 * Cell objects — Phase 5 · Unit 2 (render) + Unit 4 (transform gizmo).
 *
 * Renders every imported `CellObject` from `cellStore` at its transform
 * (mm/deg, converted to the scene's meters/radians at this boundary —
 * architecture.md invariant #3). The geometry itself lives in the runtime
 * `geometryCache`, not the store. STL geometry has no inherent material, so
 * it's wrapped in a mesh colored by `object.color`; OBJ/GLTF bring their own
 * materials and render via `<primitive>` unchanged.
 *
 * The selected object gets a drei `TransformControls` (code-standards.md:
 * "writes back to the cell store, not directly to the mesh" — we read the
 * dragged group's transform on `objectChange` and push it through
 * `updateObject`, so the store stays the single source of truth even though
 * three.js mutates the object directly during the drag itself). Translate by
 * default; holding Shift switches to rotate, per the architecture.md mock
 * ("drag to move, shift-drag to rotate"). `OrbitControls.makeDefault` in
 * `Viewport` means drei auto-disables orbiting while dragging the gizmo.
 */
const MM_TO_M = 1 / 1000
const M_TO_MM = 1000
const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

function CellObjectMesh({ object, selected }: { object: CellObject; selected: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const updateObject = useCellStore((s) => s.updateObject)
  const [mode, setMode] = useState<'translate' | 'rotate'>('translate')

  useEffect(() => {
    if (!selected) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setMode('rotate')
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setMode('translate')
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      setMode('translate')
    }
  }, [selected])

  const geometry = getCadGeometry(object.id)
  if (!geometry) return null

  const position: [number, number, number] = [
    object.transform.position.x * MM_TO_M,
    object.transform.position.y * MM_TO_M,
    object.transform.position.z * MM_TO_M,
  ]
  const rotation: [number, number, number] = [
    object.transform.rotation.x * DEG_TO_RAD,
    object.transform.rotation.y * DEG_TO_RAD,
    object.transform.rotation.z * DEG_TO_RAD,
  ]
  const scale: [number, number, number] = [
    object.transform.scale.x,
    object.transform.scale.y,
    object.transform.scale.z,
  ]

  const handleObjectChange = () => {
    const g = groupRef.current
    if (!g) return
    updateObject(object.id, {
      transform: {
        position: { x: g.position.x * M_TO_MM, y: g.position.y * M_TO_MM, z: g.position.z * M_TO_MM },
        rotation: {
          x: g.rotation.x * RAD_TO_DEG,
          y: g.rotation.y * RAD_TO_DEG,
          z: g.rotation.z * RAD_TO_DEG,
        },
        scale: { x: g.scale.x, y: g.scale.y, z: g.scale.z },
      },
    })
  }

  return (
    <>
      <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
        {geometry instanceof THREE.BufferGeometry ? (
          <mesh geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial color={object.color} />
          </mesh>
        ) : (
          <primitive object={geometry} />
        )}
      </group>
      {selected && (
        <TransformControls
          object={groupRef as RefObject<THREE.Object3D>}
          mode={mode}
          onObjectChange={handleObjectChange}
        />
      )}
    </>
  )
}

export function CellObjects() {
  const objects = useCellStore((s) => s.objects)
  const selectedId = useCellStore((s) => s.selectedId)
  return (
    <>
      {objects.map((object) => (
        <CellObjectMesh key={object.id} object={object} selected={object.id === selectedId} />
      ))}
    </>
  )
}
