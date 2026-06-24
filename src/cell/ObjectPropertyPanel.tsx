import { FrameTab } from '../ui/FrameTab'
import { useCellStore } from './cellStore'
import { CELL_OBJECT_COLOR } from './cellColors'
import type { CellObjectKind, Transform3 } from '../types'

/**
 * Object property panel — Phase 5 · Unit 3 (type + color) + Unit 5
 * (position/rotation/scale).
 *
 * Shown in the Cell Browser rail when a cell object is selected
 * (`code-standards.md`'s `ObjectPropertyPanel`). Numeric fields are the
 * direct-entry counterpart to the Unit 4 transform gizmo — both write the
 * same `cellStore.updateObject`, so dragging in the viewport and typing here
 * stay in sync. Units match the rest of the app: position mm, rotation deg
 * (architecture.md invariant #3).
 */
const KIND_LABEL: Record<CellObjectKind, string> = {
  part: 'Part',
  fixture: 'Fixture',
  obstacle: 'Obstacle',
}
const KINDS: CellObjectKind[] = ['part', 'fixture', 'obstacle']

type Axis = 'x' | 'y' | 'z'
type TransformField = keyof Transform3

function Vec3Row({
  label,
  unit,
  value,
  step,
  onChange,
}: {
  label: string
  unit: string
  value: { x: number; y: number; z: number }
  step: number
  onChange: (axis: Axis, n: number) => void
}) {
  return (
    <div>
      <p className="text-faint mb-1 text-[10px] font-semibold uppercase tracking-widest">
        {label} <span className="text-faint">({unit})</span>
      </p>
      <div className="grid grid-cols-3 gap-1">
        {(['x', 'y', 'z'] as Axis[]).map((axis) => (
          <input
            key={axis}
            type="number"
            step={step}
            value={value[axis]}
            onChange={(e) => onChange(axis, Number(e.target.value) || 0)}
            aria-label={`${label} ${axis.toUpperCase()}`}
            className="w-full rounded-sm border border-border-default bg-surface-2 px-1.5 py-1 font-mono text-[11px] text-primary"
          />
        ))}
      </div>
    </div>
  )
}

export function ObjectPropertyPanel() {
  const selectedId = useCellStore((s) => s.selectedId)
  const object = useCellStore((s) => s.objects.find((o) => o.id === selectedId))
  const updateObject = useCellStore((s) => s.updateObject)

  if (!object) return null

  const setTransformAxis = (field: TransformField, axis: Axis, n: number) => {
    updateObject(object.id, {
      transform: { ...object.transform, [field]: { ...object.transform[field], [axis]: n } },
    })
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border-default bg-well p-2">
      <p className="text-faint truncate font-mono text-[11px]" title={object.name}>
        {object.name}
      </p>

      <div>
        <p className="text-faint mb-1 text-[10px] font-semibold uppercase tracking-widest">Type</p>
        <div className="flex gap-1">
          {KINDS.map((kind) => (
            <FrameTab
              key={kind}
              label={KIND_LABEL[kind]}
              active={object.kind === kind}
              className="flex-1 !px-1.5 !py-1 text-[10px]"
              onClick={() => updateObject(object.id, { kind, color: CELL_OBJECT_COLOR[kind] })}
            />
          ))}
        </div>
      </div>

      <Vec3Row
        label="Position"
        unit="mm"
        step={1}
        value={object.transform.position}
        onChange={(axis, n) => setTransformAxis('position', axis, n)}
      />
      <Vec3Row
        label="Rotation"
        unit="deg"
        step={1}
        value={object.transform.rotation}
        onChange={(axis, n) => setTransformAxis('rotation', axis, n)}
      />
      <Vec3Row
        label="Scale"
        unit="×"
        step={0.1}
        value={object.transform.scale}
        onChange={(axis, n) => setTransformAxis('scale', axis, n)}
      />

      <div>
        <p className="text-faint mb-1 text-[10px] font-semibold uppercase tracking-widest">Color</p>
        <div className="flex items-center gap-1.5">
          {KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              title={KIND_LABEL[kind]}
              onClick={() => updateObject(object.id, { color: CELL_OBJECT_COLOR[kind] })}
              className={`h-5 w-5 rounded-full border-2 ${
                object.color === CELL_OBJECT_COLOR[kind] ? 'border-primary' : 'border-transparent'
              }`}
              style={{ background: CELL_OBJECT_COLOR[kind] }}
            />
          ))}
          <input
            type="color"
            value={object.color}
            onChange={(e) => updateObject(object.id, { color: e.target.value })}
            title="Custom color"
            className="h-5 w-7 cursor-pointer rounded-sm border border-border-default bg-transparent"
          />
        </div>
      </div>
    </div>
  )
}
