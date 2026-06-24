/**
 * Scene colors.
 *
 * three.js materials take color values, not CSS custom properties, so the scene
 * cannot read the `--token` variables from src/index.css directly. These mirror
 * the tokens in context/ui-context.md — keep them in sync with src/index.css.
 *
 * Axis colors follow the universal CAD/robotics convention X=red, Y=green,
 * Z=blue, picked from the nearest ArmStudio state/accent tokens so the base
 * frame reads the same as the rest of the UI.
 */
export const SCENE_COLORS = {
  background: '#131720', // --bg-well (viewport well)
  gridCell: '#2a3040', // --border-default (minor grid lines)
  gridSection: '#3d4860', // --border-emphasis (major grid lines)
  axisX: '#e8453c', // --state-error (red)
  axisY: '#3dbd7a', // --state-ready (green)
  axisZ: '#4a9ee8', // --accent-blue (blue)
  trail: '#f5a623', // --accent-amber (TCP motion trail)
  tcpMarker: '#4a9ee8', // --accent-blue (kinematic TCP point)
  objPart: '#4a9ee8', // --obj-part
  objFixture: '#8a95a8', // --obj-fixture
  objObstacle: '#f0b429', // --obj-obstacle
} as const
