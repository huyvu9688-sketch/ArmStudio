/**
 * Core domain types (code-standards.md: "Core domain types").
 *
 * This file holds the shared vocabulary used across kinematics, config, the
 * driver layer, and the UI. It grows as phases land — Pose, IKResult,
 * Instruction, Program, CellObject, RobotState, and protocol messages join in
 * their respective units. For Unit 4 it provides the config-facing types.
 */

/** Six joint angles in DEGREES (UI/config units; kinematics converts to rad). */
export type JointAngles = [number, number, number, number, number, number]

/**
 * TCP pose in UI units: position MILLIMETRES, orientation DEGREES as Euler
 * angles in XYZ order (matches THREE.Euler default 'XYZ', so the scene can
 * consume rx/ry/rz directly).
 */
export interface Pose {
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
}

/**
 * One row of the modified-DH table (lengths mm, angles degrees):
 *  - `a`           link length   — distance along Xᵢ from Zᵢ to Zᵢ₊₁
 *  - `d`           link offset   — distance along Zᵢ from Xᵢ₋₁ to Xᵢ
 *  - `alpha`       link twist    — angle about Xᵢ from Zᵢ to Zᵢ₊₁
 *  - `thetaOffset` joint offset  — constant added to the joint variable θ
 */
export interface DHParam {
  a: number
  d: number
  alpha: number
  thetaOffset: number
}

/** Inclusive joint travel limit in DEGREES. */
export interface JointLimit {
  min: number
  max: number
}

/** Local rotation axis a joint drives on its GLB node. */
export type JointAxis = 'x' | 'y' | 'z'

/**
 * Why an inverse-kinematics request failed (architecture.md, invariant #5 — IK
 * never fails silently):
 *  - `unreachable` target lies outside the reachable workspace;
 *  - `singular`    the arm is at/near a kinematic singularity (Jacobian rank-loss);
 *  - `limit`       a joint would have to exceed its travel limit to reach the pose.
 */
export type IKFailureReason = 'unreachable' | 'singular' | 'limit'

/** Result of an IK solve: either joint angles (deg) or a typed failure reason. */
export type IKResult =
  | { ok: true; angles: JointAngles }
  | { ok: false; reason: IKFailureReason }

/**
 * A taught point (FANUC P[]-style): a named pose captured with the joint
 * configuration that reached it, so MOVJ can replay the exact joint solution
 * the teacher used (rather than re-solving IK and risking a different
 * elbow/wrist branch).
 */
export interface Waypoint {
  id: string
  name: string
  pose: Pose
  angles: JointAngles
}

/** Joint move: interpolates joint angles to the waypoint (see `program/motion.ts`). */
export interface MovJ {
  id: string
  kind: 'MOVJ'
  waypointId: string
  speedPct: number
}

/** Linear move: interpolates TCP pose to the waypoint (see `program/motion.ts`). */
export interface MovL {
  id: string
  kind: 'MOVL'
  waypointId: string
  speedPct: number
}

/** Pause program playback for a fixed duration. */
export interface Wait {
  id: string
  kind: 'WAIT'
  seconds: number
}

/** Invoke another program by id. */
export interface Call {
  id: string
  kind: 'CALL'
  programId: string
}

/** One program step (code-standards.md: extend this union to add instruction types). */
export type Instruction = MovJ | MovL | Wait | Call

/** A saved program: its taught points plus the instruction sequence over them. */
export interface Program {
  version: 1
  id: string
  name: string
  waypoints: Waypoint[]
  instructions: Instruction[]
}

/** Position (mm) + Euler rotation (deg) + scale (unitless) for a cell object. */
export interface Transform3 {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
}

/** What an imported mesh represents in the cell (architecture.md CAD import pipeline). */
export type CellObjectKind = 'part' | 'fixture' | 'obstacle'

/**
 * A mesh placed in the 3D cell (Roboguide: Cell Browser item). `geometryRef`
 * names the source asset (e.g. the imported filename); the actual
 * `BufferGeometry`/`Group` is held in memory by the loader (`src/cad/`, next
 * unit) and never serialized into this record.
 */
export interface CellObject {
  id: string
  name: string
  kind: CellObjectKind
  geometryRef: string
  transform: Transform3
  color: string
}

/**
 * A registered tool or user frame (project-overview.md: "Tool frame and user
 * frame definitions"). `offset` is direct-entry: for a tool frame it's the
 * controlled point's offset from the wrist tool0 (mm/deg); for a user frame
 * it's the origin's offset from the world base. Both reuse `Pose`'s shape
 * rather than a separate type, since a frame *is* a pose relative to its
 * parent.
 */
export interface Frame {
  id: string
  name: string
  offset: Pose
}
