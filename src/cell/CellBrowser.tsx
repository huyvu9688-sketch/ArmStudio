import { useRef, useState } from 'react'
import { CellTreeLeaf, CellTreeSection } from '../ui/CellTreeNode'
import { useCellStore } from './cellStore'
import { useProgramStore } from '../state/programStore'
import { CELL_OBJECT_COLOR } from './cellColors'
import { importCadFiles } from '../cad/importCadFile'
import { ObjectPropertyPanel } from './ObjectPropertyPanel'
import type { CellObjectKind } from '../types'

/**
 * Cell Browser — Phase 5 · Unit 1 (tree) + Unit 2 (CAD import) + Unit 3
 * (selecting an object shows `ObjectPropertyPanel` below the tree).
 *
 * The left-rail tree from ui-context.md: Robot / Parts / Fixtures / Obstacles
 * (from `cellStore`) / Targets (the active program's taught waypoints —
 * reuses `programStore`, no separate target store). Clicking a leaf selects
 * it in `cellStore`; the transform gizmo (Unit 4) that also reacts to
 * selection is a later unit. "Import CAD" opens a file picker
 * (`importCadFile` validates + loads + pushes to the store); every imported
 * object defaults to kind `part` until reassigned via the property panel.
 */
const KIND_LABEL: Record<CellObjectKind, string> = {
  part: 'Parts',
  fixture: 'Fixtures',
  obstacle: 'Obstacles',
}

export function CellBrowser() {
  const objects = useCellStore((s) => s.objects)
  const selectedId = useCellStore((s) => s.selectedId)
  const selectObject = useCellStore((s) => s.selectObject)
  const removeObject = useCellStore((s) => s.removeObject)
  const importError = useCellStore((s) => s.importError)
  const waypoints = useProgramStore((s) => s.program.waypoints)

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    robot: false,
    part: true,
    fixture: true,
    obstacle: true,
    targets: false,
  })
  const toggle = (key: string) => setExpanded((s) => ({ ...s, [key]: !s[key] }))

  const fileInputRef = useRef<HTMLInputElement>(null)

  const kinds: CellObjectKind[] = ['part', 'fixture', 'obstacle']

  return (
    <div className="flex flex-col gap-1">
      <CellTreeSection label="Robot" expanded={expanded.robot} onToggle={() => toggle('robot')}>
        <CellTreeLeaf label="robot-arm" />
      </CellTreeSection>

      {kinds.map((kind) => {
        const items = objects.filter((o) => o.kind === kind)
        return (
          <CellTreeSection
            key={kind}
            label={KIND_LABEL[kind]}
            expanded={expanded[kind]}
            onToggle={() => toggle(kind)}
            count={items.length}
          >
            {items.length === 0 && <p className="text-faint px-1 py-1 text-xs">none imported</p>}
            {items.map((o) => (
              <CellTreeLeaf
                key={o.id}
                label={o.name}
                dotColor={CELL_OBJECT_COLOR[kind]}
                selected={o.id === selectedId}
                onSelect={() => selectObject(o.id)}
                onDelete={() => removeObject(o.id)}
              />
            ))}
          </CellTreeSection>
        )
      })}

      <CellTreeSection
        label="Targets"
        expanded={expanded.targets}
        onToggle={() => toggle('targets')}
        count={waypoints.length}
      >
        {waypoints.length === 0 && <p className="text-faint px-1 py-1 text-xs">none taught</p>}
        {waypoints.map((w) => (
          <CellTreeLeaf key={w.id} label={w.name} dotColor="var(--accent-blue)" />
        ))}
      </CellTreeSection>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mt-2 rounded-sm border border-border-default bg-surface-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted hover:border-border-emphasis hover:text-primary"
      >
        + Import CAD
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".stl,.obj,.gltf,.glb"
        multiple
        className="hidden"
        onChange={(e) => {
          // `e.target.files` is a *live* FileList — copy it before clearing
          // `value`, which would otherwise empty this same reference.
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (files.length > 0) void importCadFiles(files)
        }}
      />
      {importError && (
        <p className="text-error font-mono text-[10px] uppercase tracking-wide">⚠ {importError}</p>
      )}

      <ObjectPropertyPanel />
    </div>
  )
}
