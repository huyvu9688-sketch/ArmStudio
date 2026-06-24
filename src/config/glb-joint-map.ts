import type { JointAxis } from '../types'

/**
 * GLB joint map for the CURRENT supplied model — an adapter from our six
 * logical joints (J1..J6) to the model's actual rig nodes and rotation axes.
 *
 * Why this exists separately from JOINT_NODES/JOINT_AXES in dh-params.ts:
 * the supplied "Robot 6 Axis" model is a Cinema4D-rigged arm whose baked
 * animation drives only FOUR pivots (`Null_3`, `Null_4`, `Null_1`, `Null_6`)
 * about non-trivial local axes. The two wrist roll joints (J4, J6) have no
 * separate pivot — they are baked rigidly into the wrist group. This map
 * encodes that reality; the locked DH config stays the clean 6-joint target.
 *
 * Axes/signs were recovered empirically from the animation keyframes
 * (scratchpad inspection): each pivot's local rotation axis and direction.
 *
 * When the model is re-rigged in Blender to the clean Base→Link1..Link6→TCP
 * hierarchy, delete this file and drive the GLB straight from JOINT_NODES/
 * JOINT_AXES. (architecture.md, invariant #6: axes come from config, not scene.)
 */
export interface GlbJointMapping {
  /** GLB node name driven by this joint, or null if the model has no pivot. */
  node: string | null
  /** Local rotation axis on that node. */
  axis: JointAxis
  /** Direction relative to our +angle convention (flip if a joint jogs back-to-front). */
  sign: 1 | -1
}

/** J1..J6 → current model. `null` node = joint does not articulate this model. */
export const GLB_JOINT_MAP: readonly GlbJointMapping[] = [
  { node: 'Null_3', axis: 'x', sign: 1 }, // J1 waist
  { node: 'Null_4', axis: 'z', sign: 1 }, // J2 shoulder
  { node: 'Null_1', axis: 'x', sign: 1 }, // J3 elbow
  { node: null, axis: 'x', sign: 1 }, // J4 forearm roll — no pivot on this model (re-rig)
  { node: 'Null_6', axis: 'z', sign: 1 }, // J5 wrist pitch
  { node: null, axis: 'z', sign: 1 }, // J6 tool roll — no pivot on this model (re-rig)
]
