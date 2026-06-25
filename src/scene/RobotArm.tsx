import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { GLB_JOINT_MAP } from '../config/glb-joint-map'
import { useMeasureStore } from '../state/measureStore'
import { useRobotStore } from '../state/robotStore'
import { deg2rad } from '../kinematics/units'
import type { JointAxis } from '../types'

/**
 * Real GLB arm — Phase 1 · Units 3 & 6.
 *
 * Loads `public/models/robot-arm.glb`, seats it on the floor, and drives its
 * joint pivots from the live joint angles in the robot store (one `useFrame`
 * loop; the scene never holds pose in local state — code-standards.md).
 *
 * The supplied model is a Cinema4D `Null`-empty rig with only four animated
 * pivots, so only J1/J2/J3/J5 articulate; J4/J6 have no pivot until the model is
 * re-rigged. The node→axis→sign mapping lives in config/glb-joint-map.ts so no
 * axis is hardcoded here (architecture.md, invariant #6). The baked animation is
 * intentionally not played — each pivot rests at its authored quaternion, onto
 * which we post-multiply the joint rotation.
 */
const ARM_GLB_URL = '/models/robot-arm.glb'

const AXIS_VECTORS: Record<JointAxis, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
}

interface DrivenJoint {
  node: THREE.Object3D
  restQuat: THREE.Quaternion
  axis: THREE.Vector3
  sign: number
}

export function RobotArm() {
  const { scene } = useGLTF(ARM_GLB_URL)

  const model = useMemo(() => {
    // Clone so r3f/HMR re-renders don't mutate the cached GLTF scene.
    const root = scene.clone(true)

    // Seat on the floor, centered on XZ.
    const box = new THREE.Box3().setFromObject(root)
    const center = new THREE.Vector3()
    box.getCenter(center)
    root.position.set(-center.x, -box.min.y, -center.z)

    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })

    return root
  }, [scene])

  // Resolve each logical joint to its GLB node + rest pose. Indexed J1..J6;
  // null entries (no pivot on this model) are skipped at drive time.
  const joints = useMemo<(DrivenJoint | null)[]>(() => {
    return GLB_JOINT_MAP.map((m) => {
      if (!m.node) return null
      const node = model.getObjectByName(m.node)
      if (!node) {
        console.warn(`[ArmStudio] GLB joint node "${m.node}" not found; joint inert.`)
        return null
      }
      return {
        node,
        restQuat: node.quaternion.clone(),
        axis: AXIS_VECTORS[m.axis],
        sign: m.sign,
      }
    })
  }, [model])

  // Scratch quaternion reused each frame (no per-frame allocation).
  const delta = useMemo(() => new THREE.Quaternion(), [])

  useFrame(() => {
    const { angles } = useRobotStore.getState()
    for (let i = 0; i < joints.length; i++) {
      const j = joints[i]
      if (!j) continue
      // pose = rest · Rot(localAxis, angle): post-multiply applies in local frame.
      delta.setFromAxisAngle(j.axis, j.sign * deg2rad(angles[i]))
      j.node.quaternion.copy(j.restQuat).multiply(delta)
    }
  })

  // Measure tool: while armed, a click on the mesh records the raycast hit's
  // world-space point (scene metres) as a ruler endpoint. onClick (not
  // pointerdown) so dragging to orbit doesn't drop a stray point. Hovering
  // extracts the exact triangle the raycast hit (not the whole mesh object —
  // a GLB link is one mesh with many faces, so highlighting the object lit
  // up the entire link) and stores its 3 world-space vertices for
  // `MeasureTool` to render as a small overlay, so you see precisely which
  // face you're about to click.
  const measureActive = useMeasureStore((s) => s.active)
  const addMeasurePoint = useMeasureStore((s) => s.addPoint)
  const setHoverFace = useMeasureStore((s) => s.setHoverFace)
  const lastFaceKey = useRef<string | null>(null)

  // Reset hover/cursor the instant measure mode is turned off (e.g. via the
  // overlay button while the pointer never left the canvas).
  useEffect(() => {
    if (!measureActive) {
      document.body.style.cursor = 'auto'
      setHoverFace(null)
      lastFaceKey.current = null
    }
  }, [measureActive, setHoverFace])

  function onModelPointerMove(e: ThreeEvent<PointerEvent>) {
    if (!measureActive) return
    document.body.style.cursor = 'crosshair'
    const mesh = e.object as THREE.Mesh
    if (!mesh.isMesh || !e.face) return

    const key = `${mesh.uuid}:${e.faceIndex}`
    if (key === lastFaceKey.current) return
    e.stopPropagation()
    lastFaceKey.current = key

    const pos = mesh.geometry.attributes.position
    const toWorld = (i: number) => new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
    const [a, b, c] = [e.face.a, e.face.b, e.face.c].map(toWorld)
    setHoverFace([
      [a.x, a.y, a.z],
      [b.x, b.y, b.z],
      [c.x, c.y, c.z],
    ])
  }

  function onModelPointerLeave() {
    if (!measureActive) return
    document.body.style.cursor = 'auto'
    setHoverFace(null)
    lastFaceKey.current = null
  }

  function onModelClick(e: ThreeEvent<MouseEvent>) {
    if (!measureActive) return
    e.stopPropagation()
    addMeasurePoint([e.point.x, e.point.y, e.point.z])
  }

  return (
    <primitive
      object={model}
      onClick={onModelClick}
      onPointerMove={onModelPointerMove}
      onPointerLeave={onModelPointerLeave}
    />
  )
}

useGLTF.preload(ARM_GLB_URL)
