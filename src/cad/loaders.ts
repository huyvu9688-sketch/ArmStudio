import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { AllowedExtension } from './validate'

/**
 * CAD mesh loaders — Phase 5 · Unit 2 (architecture.md CAD import pipeline).
 *
 * Dispatches to the three.js loader for the validated extension and returns
 * geometry/a scene graph centered on its own local origin (code-standards.md:
 * "Center the geometry on import") — placement in the cell is the caller's
 * `CellObject.transform`, not where the source file happened to model it.
 */
const stlLoader = new STLLoader()
const objLoader = new OBJLoader()
const gltfLoader = new GLTFLoader()

function centerObject3D(object: THREE.Object3D): void {
  const box = new THREE.Box3().setFromObject(object)
  const center = box.getCenter(new THREE.Vector3())
  object.position.sub(center)
}

async function loadStl(buffer: ArrayBuffer): Promise<THREE.BufferGeometry> {
  const geometry = stlLoader.parse(buffer)
  geometry.center()
  return geometry
}

async function loadObj(text: string): Promise<THREE.Group> {
  const group = objLoader.parse(text)
  centerObject3D(group)
  return group
}

async function loadGltf(buffer: ArrayBuffer): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    gltfLoader.parse(
      buffer,
      '',
      (gltf) => {
        centerObject3D(gltf.scene)
        resolve(gltf.scene)
      },
      (err) => reject(err instanceof Error ? err : new Error(String(err))),
    )
  })
}

/** Load a validated CAD file into three.js geometry/a scene graph, centered at its local origin. */
export async function loadCadFile(
  file: File,
  extension: AllowedExtension,
): Promise<THREE.BufferGeometry | THREE.Object3D> {
  switch (extension) {
    case 'stl':
      return loadStl(await file.arrayBuffer())
    case 'obj':
      return loadObj(await file.text())
    case 'gltf':
    case 'glb':
      return loadGltf(await file.arrayBuffer())
  }
}
