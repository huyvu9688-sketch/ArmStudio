import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { forwardKinematics } from '../kinematics/forward'
import { mm2m } from '../kinematics/units'
import { useRobotStore } from '../state/robotStore'
import { useSettingsStore } from '../state/settingsStore'
import { SCENE_COLORS } from './colors'

/**
 * TCP motion trail — Phase 3 · Unit 6.
 *
 * Traces the kinematic TCP path so MOVL (straight line) reads differently from
 * MOVJ (curved), and jogging leaves a visible trace — Roboguide's path trace.
 *
 * The trail is computed from forward kinematics (the source of truth), whose
 * Z-up DH frame is mapped onto the scene's Y-up frame by a −90° rotation about X:
 * (x, y, z)_fk → (x, z, −y)_scene. It is therefore anchored to the base triad at
 * the origin, not to the separately auto-seated GLB mesh (a 4-DOF stand-in until
 * re-rig) — the path's shape is what matters here. A blue marker follows the live
 * TCP point each frame (via a ref, no re-render); a new trail vertex is appended
 * to React state only when the TCP has actually moved, so idle frames are free.
 * The "Clear" action remounts this component (via a key in the Viewport), which
 * resets the buffer without an effect.
 */
type Point = [number, number, number]

/** Max retained trail vertices (oldest dropped) — bounds the geometry cost. */
const MAX_POINTS = 800
/** Only append a vertex once the TCP has moved this far (metres). */
const MIN_SEGMENT_M = 0.002

/** FK pose (mm, Z-up) → scene position (m, Y-up). */
function sceneFromFk(xMm: number, yMm: number, zMm: number): Point {
  return [mm2m(xMm), mm2m(zMm), mm2m(-yMm)]
}

export function TcpTrail() {
  const showTrail = useSettingsStore((s) => s.showTrail)
  const [points, setPoints] = useState<Point[]>([])
  const lastRef = useRef<Point | null>(null)
  const markerRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const pose = forwardKinematics(useRobotStore.getState().angles)
    const p = sceneFromFk(pose.x, pose.y, pose.z)
    if (markerRef.current) markerRef.current.position.set(p[0], p[1], p[2])

    if (!useSettingsStore.getState().showTrail) return
    const last = lastRef.current
    if (last && Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]) < MIN_SEGMENT_M) {
      return
    }
    lastRef.current = p
    setPoints((prev) => {
      const base = prev.length >= MAX_POINTS ? prev.slice(prev.length - MAX_POINTS + 1) : prev
      return [...base, p]
    })
  })

  return (
    <>
      {showTrail && points.length >= 2 && (
        <Line points={points} color={SCENE_COLORS.trail} lineWidth={1.5} />
      )}
      <mesh ref={markerRef} visible={showTrail}>
        <sphereGeometry args={[0.008, 16, 16]} />
        <meshBasicMaterial color={SCENE_COLORS.tcpMarker} />
      </mesh>
    </>
  )
}
