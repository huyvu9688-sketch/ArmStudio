import { Line } from '@react-three/drei'
import { useMeasureStore } from '../state/measureStore'
import { SCENE_COLORS } from './colors'

/**
 * Measure tool — draws the two-point ruler in the scene.
 *
 * Renders a small marker at each clicked point and a line between them; the
 * numeric distance is shown in `ViewportOverlay` (HTML, outside the canvas).
 * Points are captured by `RobotArm`'s click handler (raycast hit point) while
 * `measureStore.active`, so this component is purely presentational.
 */
export function MeasureTool() {
  const points = useMeasureStore((s) => s.points)

  return (
    <>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.006, 16, 16]} />
          <meshBasicMaterial color={SCENE_COLORS.measure} depthTest={false} />
        </mesh>
      ))}
      {points.length === 2 && (
        <Line points={points} color={SCENE_COLORS.measure} lineWidth={1.5} depthTest={false} />
      )}
    </>
  )
}
