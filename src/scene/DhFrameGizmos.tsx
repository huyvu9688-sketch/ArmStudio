import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { jointTransforms } from '../kinematics/forward'
import { useRobotStore } from '../state/robotStore'
import { useSettingsStore } from '../state/settingsStore'
import { AxisTriad } from './AxisTriad'

/**
 * DH coordinate frame gizmos — Phase 6 · Unit 1.
 *
 * One small `AxisTriad` per joint (base→J1..base→J6, i.e. `jointTransforms`'
 * six cumulative DH frames), positioned/oriented live as the arm moves — the
 * study-tools "toggle DH coordinate frames" feature (project-overview.md).
 * Pure scene-layer unit per ai-workflow-rules.md ("don't combine scene
 * changes with kinematics changes in one step"): `jointTransforms` already
 * existed in `kinematics/forward.ts`, unchanged here.
 *
 * `jointTransforms` returns Z-up DH-frame metres (gl-matrix `mat4`, column-
 * major — the same memory layout THREE.Matrix4 uses, so it loads directly via
 * `fromArray`). Mapping a whole *frame* (not just a point) into the Y-up scene
 * takes the same fixed −90°-about-X remap `sceneFromFk` applies to points,
 * left-multiplied onto the frame's transform: scene_T = FK_TO_SCENE · fk_T
 * (rotates the frame's basis vectors the same way it rotates positions — see
 * `sceneFrame.ts`'s mapping comment for the underlying convention).
 *
 * Mounted unconditionally in `Viewport` (matches `TcpTrail`'s pattern) so
 * toggling doesn't remount the gizmos; each triad's own visibility follows
 * `showDhFrames` instead.
 */
const FK_TO_SCENE = new THREE.Matrix4().makeRotationX(-Math.PI / 2)
const JOINT_COUNT = 6
const TRIAD_SIZE = 0.08 // meters — smaller than the base triad (0.3) to avoid clutter

export function DhFrameGizmos() {
  const showDhFrames = useSettingsStore((s) => s.showDhFrames)
  const groupRefs = useRef<(THREE.Group | null)[]>([])

  // Scratch objects reused every frame — no per-frame allocation.
  const scratch = useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      scale: new THREE.Vector3(),
    }),
    [],
  )

  useFrame(() => {
    if (!showDhFrames) return
    const frames = jointTransforms(useRobotStore.getState().angles)
    for (let i = 0; i < frames.length; i++) {
      const group = groupRefs.current[i]
      if (!group) continue
      scratch.matrix.fromArray(frames[i] as unknown as number[])
      scratch.matrix.premultiply(FK_TO_SCENE)
      scratch.matrix.decompose(scratch.position, scratch.quaternion, scratch.scale)
      group.position.copy(scratch.position)
      group.quaternion.copy(scratch.quaternion)
    }
  })

  return (
    <>
      {Array.from({ length: JOINT_COUNT }, (_, i) => (
        <group key={i} visible={showDhFrames} ref={(el) => (groupRefs.current[i] = el)}>
          <AxisTriad size={TRIAD_SIZE} />
        </group>
      ))}
    </>
  )
}
