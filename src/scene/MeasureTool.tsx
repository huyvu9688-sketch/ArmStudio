import { useEffect, useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useMeasureStore } from '../state/measureStore'
import { SCENE_COLORS } from './colors'
import { FK_AXIS_TO_SCENE } from './sceneFrame'
import type { JointAxis } from '../types'

type ScenePoint = [number, number, number]

const FK_AXES: JointAxis[] = ['x', 'y', 'z']
/** Scene-index-ordered axis colors, matching AxisTriad's red/green/blue (X/Y/Z). */
const SCENE_AXIS_COLORS = [SCENE_COLORS.axisX, SCENE_COLORS.axisY, SCENE_COLORS.axisZ]

/**
 * Decompose A→B into an axis-aligned "staircase": one segment per FK/DH axis
 * (X, then Y, then Z), each only changing that one scene coordinate — the
 * CAD-measure-tool convention (dX/dY/dZ drawn as separate colored legs, not a
 * single diagonal). Colored to match `AxisTriad`'s established red/green/blue
 * (note FK Y maps to the scene Z/"blue" axis and FK Z to scene Y/"green" —
 * see `FK_AXIS_TO_SCENE` — so segment color follows the *scene* axis each FK
 * axis actually moves along, staying consistent with the on-screen base triad).
 */
function buildStaircase(a: ScenePoint, b: ScenePoint) {
  let current = a
  const segments: { points: [ScenePoint, ScenePoint]; color: string }[] = []
  for (const axis of FK_AXES) {
    const { index } = FK_AXIS_TO_SCENE[axis]
    if (current[index] === b[index]) continue
    const next = [...current] as ScenePoint
    next[index] = b[index]
    segments.push({ points: [current, next], color: SCENE_AXIS_COLORS[index] })
    current = next
  }
  return segments
}

/**
 * Measure tool — draws the two-point ruler plus the hovered-face highlight.
 *
 * Renders a small marker at each clicked point, the axis-aligned dX/dY/dZ
 * staircase (`buildStaircase`), and a dashed direct line for the straight-
 * line "Center Dist" — all simultaneously, matching how SolidWorks-style
 * measure tools show every component at once rather than gating behind a
 * lock. `FaceHighlight` overlays the exact triangle under the cursor
 * (computed in `RobotArm`) so you see precisely which face you're about to
 * click, rather than the whole mesh object lighting up. Points are captured
 * by `RobotArm`'s click handler (raycast hit point) while
 * `measureStore.active`. The numeric readout lives in `ViewportOverlay`
 * (HTML, outside the canvas).
 */
export function MeasureTool() {
  const points = useMeasureStore((s) => s.points)
  const segments = points.length === 2 ? buildStaircase(points[0], points[1]) : []

  return (
    <>
      <FaceHighlight />
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.006, 16, 16]} />
          <meshBasicMaterial color={SCENE_COLORS.measure} depthTest={false} />
        </mesh>
      ))}
      {segments.map((seg, i) => (
        <Line key={i} points={seg.points} color={seg.color} lineWidth={2} depthTest={false} />
      ))}
      {points.length === 2 && (
        <Line
          points={points}
          color={SCENE_COLORS.measure}
          lineWidth={1}
          dashed
          dashSize={0.012}
          gapSize={0.008}
          depthTest={false}
        />
      )}
    </>
  )
}

/** Small overlay triangle covering exactly the face the raycast last hit. */
function FaceHighlight() {
  const hoverFace = useMeasureStore((s) => s.hoverFace)

  const geometry = useMemo(() => {
    if (!hoverFace) return null
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(hoverFace.flat()), 3))
    geo.computeVertexNormals()
    return geo
  }, [hoverFace])

  useEffect(() => () => geometry?.dispose(), [geometry])

  if (!geometry) return null
  return (
    <mesh geometry={geometry} renderOrder={999}>
      <meshBasicMaterial
        color={SCENE_COLORS.measure}
        transparent
        opacity={0.55}
        side={THREE.DoubleSide}
        depthTest={false}
      />
    </mesh>
  )
}
