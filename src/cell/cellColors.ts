import type { CellObjectKind } from '../types'

/**
 * Cell object colors — mirrors `ui-context.md`'s `--obj-part`/`--obj-fixture`/
 * `--obj-obstacle` tokens. Shared by the Cell Browser tree dots, the CAD
 * import default, and the scene's fallback material for bare geometry (STL
 * has no inherent material/color, unlike OBJ/GLTF).
 */
export const CELL_OBJECT_COLOR: Record<CellObjectKind, string> = {
  part: '#4a9ee8',
  fixture: '#8a95a8',
  obstacle: '#f0b429',
}
