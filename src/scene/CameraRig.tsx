import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { forwardKinematics } from '../kinematics/forward'
import { useRobotStore } from '../state/robotStore'
import { useSettingsStore } from '../state/settingsStore'
import { activeCameraRef } from './activeCamera'
import { sceneFromFk } from './sceneFrame'

/**
 * Camera rig — Phase 5 · Unit 7.
 *
 * Wraps the orbit camera with the multiple-view presets from
 * project-overview.md: Orbit (the Phase 1 default iso view), Front/Side/Top
 * (one-shot snaps — the user can still orbit freely afterward), and TCP-follow
 * (continuously re-centers the orbit target on the live TCP each frame, so you
 * orbit *around* the tool point instead of the origin). Presets only move the
 * camera/target; `OrbitControls` itself stays mounted and `makeDefault` the
 * whole time, so `TransformControls` (Unit 4) can still find and disable it.
 */
const PRESETS: Record<'orbit' | 'front' | 'side' | 'top', { position: [number, number, number]; target: [number, number, number] }> = {
  orbit: { position: [1.1, 0.9, 1.1], target: [0, 0.2, 0] },
  front: { position: [0, 0.3, 1.4], target: [0, 0.3, 0] },
  side: { position: [1.4, 0.3, 0], target: [0, 0.3, 0] },
  top: { position: [0, 1.6, 0.001], target: [0, 0, 0] },
}

export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()
  const view = useSettingsStore((s) => s.cameraView)
  const snapNonce = useSettingsStore((s) => s.cameraSnapNonce)

  useEffect(() => {
    activeCameraRef.current = camera
    return () => {
      activeCameraRef.current = null
    }
  }, [camera])

  useEffect(() => {
    if (view === 'tcp') return // continuous follow, handled in useFrame below
    const preset = PRESETS[view]
    camera.position.set(...preset.position)
    controlsRef.current?.target.set(...preset.target)
    controlsRef.current?.update()
    // snapNonce (unused in the body) forces a re-snap when the same preset is clicked again.
  }, [view, snapNonce, camera])

  useFrame(() => {
    if (view !== 'tcp' || !controlsRef.current) return
    const pose = forwardKinematics(useRobotStore.getState().angles)
    const [x, y, z] = sceneFromFk(pose.x, pose.y, pose.z)
    controlsRef.current.target.set(x, y, z)
    controlsRef.current.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      minDistance={0.3}
      maxDistance={6}
      maxPolarAngle={Math.PI / 2}
    />
  )
}
