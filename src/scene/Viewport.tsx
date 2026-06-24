import { Canvas } from '@react-three/fiber'
import {
  Grid,
  OrbitControls,
  GizmoHelper,
  GizmoViewport,
} from '@react-three/drei'
import { useSettingsStore } from '../state/settingsStore'
import { SCENE_COLORS } from './colors'
import { AxisTriad } from './AxisTriad'
import { Arm } from './Arm'
import { TcpTrail } from './TcpTrail'

/**
 * 3D viewport — Phase 1 · Unit 2 (scene shell).
 *
 * The r3f Canvas hosting the cell. Scene units are meters (the arm is ~0.71 m;
 * kinematics works in meters/radians per architecture.md). Y is up and the
 * floor lies on the XZ plane (three.js convention). The robot's own Z-up DH
 * frame is mapped onto the scene when the arm is added in Units 3–6.
 *
 * Contents for this unit: lighting, an infinite floor grid, the base-frame
 * triad at the origin, an orbit camera, and a corner orientation gizmo. The
 * GLB arm, cell objects, trail, and cameras arrive in later units.
 */
export function Viewport() {
  // "Clear trail" bumps this nonce; keying TcpTrail with it remounts a fresh
  // buffer without the trail component needing a reset effect.
  const trailClearNonce = useSettingsStore((s) => s.clearTrailNonce)

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [1.1, 0.9, 1.1], fov: 45, near: 0.01, far: 100 }}
    >
      <color attach="background" args={[SCENE_COLORS.background]} />

      <Lighting />
      <Floor />
      <AxisTriad size={0.3} />
      <Arm />
      <TcpTrail key={trailClearNonce} />

      <OrbitControls
        makeDefault
        enableDamping
        target={[0, 0.2, 0]}
        minDistance={0.3}
        maxDistance={6}
        maxPolarAngle={Math.PI / 2}
      />

      <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
        <GizmoViewport
          axisColors={[SCENE_COLORS.axisX, SCENE_COLORS.axisY, SCENE_COLORS.axisZ]}
          labelColor="white"
        />
      </GizmoHelper>
    </Canvas>
  )
}

/** Key + fill + ambient lighting tuned for a dark graphite cell. */
function Lighting() {
  return (
    <>
      <hemisphereLight args={['#dfe7f2', '#0c0e12', 0.55]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[3, 5, 2]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
    </>
  )
}

/** Infinite floor grid on the XZ plane: 10 cm cells, 0.5 m major sections. */
function Floor() {
  return (
    <Grid
      args={[10, 10]}
      cellSize={0.1}
      cellThickness={1}
      cellColor={SCENE_COLORS.gridCell}
      sectionSize={0.5}
      sectionThickness={1.3}
      sectionColor={SCENE_COLORS.gridSection}
      fadeDistance={9}
      fadeStrength={1.5}
      infiniteGrid
      followCamera={false}
    />
  )
}
