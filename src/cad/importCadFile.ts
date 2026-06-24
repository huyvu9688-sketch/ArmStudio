import { useCellStore } from '../cell/cellStore'
import { CELL_OBJECT_COLOR } from '../cell/cellColors'
import { setCadGeometry } from './geometryCache'
import { loadCadFile } from './loaders'
import { validateCadFile } from './validate'
import type { CellObject } from '../types'

/**
 * Import orchestration — Phase 5 · Unit 2.
 *
 * The single entry point both the file picker and viewport drag-drop call:
 * validate → load → cache the geometry by id → push a `CellObject` to
 * `cellStore`. Every import defaults to kind `part` (the obj-part color);
 * assigning a real type/color is Unit 3. `position` is the actual
 * code-standards.md "drag-to-place" point — the file picker has no drop
 * coordinate, so it omits this and lands at the cell origin.
 */
function genId(): string {
  return `obj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

const ORIGIN = { x: 0, y: 0, z: 0 }

export type ImportResult = { ok: true; object: CellObject } | { ok: false; reason: string }

export async function importCadFile(
  file: File,
  position: { x: number; y: number; z: number } = ORIGIN,
): Promise<ImportResult> {
  const { addObject, setImportError } = useCellStore.getState()

  const validation = validateCadFile(file)
  if (!validation.ok) {
    setImportError(validation.reason)
    return { ok: false, reason: validation.reason }
  }

  let geometry
  try {
    geometry = await loadCadFile(file, validation.extension)
  } catch (e) {
    const reason = `Failed to load "${file.name}": ${e instanceof Error ? e.message : String(e)}`
    setImportError(reason)
    return { ok: false, reason }
  }

  const id = genId()
  setCadGeometry(id, geometry)

  const object: CellObject = {
    id,
    name: file.name,
    kind: 'part',
    geometryRef: file.name,
    transform: { position, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    color: CELL_OBJECT_COLOR.part,
  }
  setImportError(null)
  addObject(object)
  return { ok: true, object }
}

/**
 * Import a batch (file picker `multiple` or a multi-file drop); stops at the
 * first failure. A multi-file drop places every file at the same drop point
 * (no per-file offset) — acceptable for now since drops are typically single
 * files; revisit if multi-file drag-drop turns out to need spreading out.
 */
export async function importCadFiles(
  files: Iterable<File>,
  position?: { x: number; y: number; z: number },
): Promise<void> {
  for (const file of files) {
    const result = await importCadFile(file, position)
    if (!result.ok) return
  }
}
