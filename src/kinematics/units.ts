/**
 * Unit conversions at the kinematics boundary.
 *
 * The UI and config speak millimetres + degrees; the kinematics math works in
 * metres + radians (architecture.md, invariant #3). These convert at the edge.
 */
export const deg2rad = (deg: number): number => (deg * Math.PI) / 180
export const rad2deg = (rad: number): number => (rad * 180) / Math.PI
export const mm2m = (mm: number): number => mm / 1000
export const m2mm = (m: number): number => m * 1000
