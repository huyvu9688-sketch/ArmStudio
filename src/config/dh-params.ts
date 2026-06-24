/**
 * DH parameters, joint limits, and the GLB node map — the single source of
 * truth for the arm's kinematic configuration (architecture.md, invariant #7).
 *
 * LOCKED (protected file). The DH values and limits below are transcribed
 * verbatim from architecture.md and must not be changed without first updating
 * architecture.md + progress-tracker.md (ai-workflow-rules.md: Protected Files).
 *
 * Units: lengths in MILLIMETRES, angles in DEGREES. The kinematics module
 * converts to metres/radians at its boundary (architecture.md, invariant #3).
 *
 * Convention: 6R spherical-wrist arm, ~710 mm reach, standard (distal) DH.
 * (architecture.md originally said "modified DH"; corrected in Unit 5 — these
 * locked values only form a valid arm under standard DH. Values unchanged.)
 */
import type { DHParam, JointAngles, JointAxis, JointLimit } from '../types'

/** Modified-DH table, J1→J6. See DHParam for column meanings. */
export const DH_PARAMS = [
  { a: 0, d: 200, alpha: 90, thetaOffset: 0 }, // J1 waist
  { a: 200, d: 0, alpha: 0, thetaOffset: 0 }, // J2 shoulder
  { a: 50, d: 0, alpha: 90, thetaOffset: 0 }, // J3 elbow
  { a: 0, d: 200, alpha: -90, thetaOffset: 0 }, // J4 wrist roll
  { a: 0, d: 0, alpha: 90, thetaOffset: 0 }, // J5 wrist pitch
  { a: 0, d: 60, alpha: 0, thetaOffset: 0 }, // J6 tool roll
] as const satisfies readonly DHParam[]

/** Per-joint travel limits, J1→J6 (degrees). Enforced before any driver send. */
export const JOINT_LIMITS = [
  { min: -170, max: 170 },
  { min: -90, max: 90 },
  { min: -180, max: 60 },
  { min: -170, max: 170 },
  { min: -120, max: 120 },
  { min: -170, max: 170 },
] as const satisfies readonly JointLimit[]

/** Neutral/home pose — all joints at 0° (degrees). */
export const HOME_ANGLES: JointAngles = [0, 0, 0, 0, 0, 0]

/**
 * GLB node names driven by each joint, and the local axis each rotates on.
 *
 * NOTE — these are the architecture.md *target* names (a clean Link1..Link6
 * rig). The supplied model does NOT use them: it is a Cinema4D `Null`-empty rig
 * whose baked animation drives only FOUR pivots. Unit 6 therefore drives the GLB
 * through a model-specific adapter, `config/glb-joint-map.ts` (J1..J6 → real
 * `Null` nodes + empirically-recovered local axes), leaving this locked target
 * map clean. When the model is re-rigged to Link1..Link6 in Blender, delete the
 * adapter and drive the GLB straight from JOINT_NODES/JOINT_AXES.
 */
export const JOINT_NODES = [
  'Link1',
  'Link2',
  'Link3',
  'Link4',
  'Link5',
  'Link6',
] as const

/** Local rotation axis per joint, aligned 1:1 with JOINT_NODES. */
export const JOINT_AXES = ['z', 'y', 'y', 'z', 'y', 'z'] as const satisfies readonly JointAxis[]
