import { SCENE_COLORS } from './colors'

/**
 * Primitive fallback arm — rendered when the GLB is absent or fails to load
 * (architecture.md: "if the GLB is missing, render primitives"), or when
 * VITE_ARM_MODEL='primitive'.
 *
 * A static, schematic 6R stack in meters (no joint motion yet — that arrives
 * with the kinematics in Unit 6). Proportions loosely follow the DH lengths so
 * the placeholder reads as the same ~0.7 m arm.
 */
export function PrimitiveArm() {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.06, 32]} />
        <meshStandardMaterial color={SCENE_COLORS.gridSection} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* J1 waist column */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.2, 24]} />
        <meshStandardMaterial color="#3a4252" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* J2 shoulder link */}
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.22, 0.1]} />
        <meshStandardMaterial color="#4a5468" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* J3 elbow link */}
      <mesh position={[0.0, 0.5, 0.06]} rotation={[0.5, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.07, 0.18, 0.08]} />
        <meshStandardMaterial color="#4a5468" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Wrist cluster (J4–J6) */}
      <mesh position={[0, 0.6, 0.14]} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 20]} />
        <meshStandardMaterial color={SCENE_COLORS.axisZ} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Tool flange / TCP marker */}
      <mesh position={[0, 0.6, 0.21]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.04, 16]} />
        <meshStandardMaterial color={SCENE_COLORS.axisX} metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}
