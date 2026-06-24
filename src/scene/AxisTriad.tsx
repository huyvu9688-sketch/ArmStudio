import { SCENE_COLORS } from './colors'

/**
 * A coordinate-frame triad: three colored arrows along +X (red), +Y (green),
 * +Z (blue). Used as the base-frame helper now and reused for per-joint DH
 * frame gizmos in Phase 6.
 *
 * Cylinders/cones are modeled along +Y (three.js default) and rotated onto each
 * axis. `meshBasicMaterial` keeps the triad unlit so it stays crisp regardless
 * of scene lighting — it is an overlay, not a lit object.
 *
 * `size` is the axis length in scene units (meters).
 */
export function AxisTriad({ size = 0.3 }: { size?: number }) {
  return (
    <group>
      <Axis color={SCENE_COLORS.axisX} length={size} rotation={[0, 0, -Math.PI / 2]} />
      <Axis color={SCENE_COLORS.axisY} length={size} rotation={[0, 0, 0]} />
      <Axis color={SCENE_COLORS.axisZ} length={size} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  )
}

/** One axis arrow built along +Y, then rotated onto its target axis. */
function Axis({
  color,
  length,
  rotation,
}: {
  color: string
  length: number
  rotation: [number, number, number]
}) {
  const shaftRadius = length * 0.012
  const headLength = length * 0.16
  const shaftLength = length - headLength

  return (
    <group rotation={rotation}>
      <mesh position={[0, shaftLength / 2, 0]}>
        <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, shaftLength + headLength / 2, 0]}>
        <coneGeometry args={[shaftRadius * 2.6, headLength, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}
