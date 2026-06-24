import { create } from 'zustand'
import { disposeCadGeometry } from '../cad/geometryCache'
import type { CellObject } from '../types'

/**
 * Cell store — Phase 5 · Unit 1 (shape) + Unit 2 (CAD import populates it).
 *
 * Holds the placed objects in the 3D cell (architecture.md: "`src/cell/` owns
 * the placed-object store. The scene reads the store."). `removeObject` also
 * frees the cached three.js geometry (code-standards.md: dispose on removal).
 */
interface CellStore {
  objects: CellObject[]
  selectedId: string | null
  /** Last CAD import failure (file picker or viewport drag-drop share this). */
  importError: string | null
  addObject: (object: CellObject) => void
  removeObject: (id: string) => void
  selectObject: (id: string | null) => void
  setImportError: (reason: string | null) => void
  /** Patch one object's fields (kind/color now; transform joins in Unit 4/5). */
  updateObject: (id: string, patch: Partial<CellObject>) => void
}

export const useCellStore = create<CellStore>((set) => ({
  objects: [],
  selectedId: null,
  importError: null,
  addObject: (object) => set((s) => ({ objects: [...s.objects, object] })),
  removeObject: (id) => {
    disposeCadGeometry(id)
    set((s) => ({
      objects: s.objects.filter((o) => o.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }))
  },
  selectObject: (id) => set({ selectedId: id }),
  setImportError: (reason) => set({ importError: reason }),
  updateObject: (id, patch) =>
    set((s) => ({
      objects: s.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })),
}))
