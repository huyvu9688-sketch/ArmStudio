import { useState } from 'react'
import { X } from 'lucide-react'
import { PendantButton } from '../ui/PendantButton'
import { useFramesStore } from '../state/framesStore'
import type { Frame, Pose } from '../types'

/**
 * Tool/user frame registration — Phase 5 · Unit 6.
 *
 * Direct-entry registration only (project-overview.md's 3-point method is a
 * documented gap — progress-tracker.md). Each list lets you name a frame, pick
 * it active (drives the Tool/User Cartesian jog axes in `useJog.ts`), edit its
 * offset (mm/deg, relative to tool0 for tools / world for users), or delete it.
 */
const POSE_FIELDS: { key: keyof Pose; label: string; unit: string }[] = [
  { key: 'x', label: 'X', unit: 'mm' },
  { key: 'y', label: 'Y', unit: 'mm' },
  { key: 'z', label: 'Z', unit: 'mm' },
  { key: 'rx', label: 'Rx', unit: 'deg' },
  { key: 'ry', label: 'Ry', unit: 'deg' },
  { key: 'rz', label: 'Rz', unit: 'deg' },
]

function OffsetEditor({ offset, onChange }: { offset: Pose; onChange: (offset: Pose) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 px-1 pb-1.5">
      {POSE_FIELDS.map(({ key, label, unit }) => (
        <label key={key} className="flex items-center gap-1">
          <span className="text-faint w-4 shrink-0 font-mono text-[10px]">{label}</span>
          <input
            type="number"
            step={1}
            value={offset[key]}
            onChange={(e) => onChange({ ...offset, [key]: Number(e.target.value) || 0 })}
            aria-label={`${label} (${unit})`}
            className="w-full rounded-sm border border-border-default bg-surface-2 px-1 py-0.5 font-mono text-[10px] text-primary"
          />
        </label>
      ))}
    </div>
  )
}

function FrameGroup({
  title,
  frames,
  activeId,
  onAdd,
  onSetActive,
  onUpdate,
  onRemove,
}: {
  title: string
  frames: Frame[]
  activeId: string | null
  onAdd: () => void
  onSetActive: (id: string | null) => void
  onUpdate: (id: string, offset: Pose) => void
  onRemove: (id: string) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-faint text-[11px] font-semibold uppercase tracking-widest">{title}</span>
        <button
          type="button"
          onClick={onAdd}
          className="text-faint text-[10px] font-semibold uppercase tracking-wide hover:text-primary"
        >
          + New
        </button>
      </div>
      {frames.length === 0 ? (
        <p className="text-faint mt-1 text-[11px]">None registered — direct entry only for now.</p>
      ) : (
        <div className="mt-1 flex flex-col gap-1">
          {frames.map((f) => {
            const active = f.id === activeId
            return (
              <div
                key={f.id}
                className={`rounded-md border ${active ? 'border-amber' : 'border-border-default'} bg-well`}
              >
                <div className="flex items-center gap-1.5 px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => onSetActive(active ? null : f.id)}
                    aria-pressed={active}
                    className={`flex-1 truncate text-left font-mono text-[11px] ${active ? 'text-amber' : 'text-primary hover:text-amber'}`}
                    title={active ? 'Active — click to deactivate' : 'Set active'}
                  >
                    {active ? '● ' : '○ '}
                    {f.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(f.id)}
                    aria-label={`Delete ${f.name}`}
                    className="text-error hover:text-primary"
                  >
                    <X size={12} />
                  </button>
                </div>
                <OffsetEditor offset={f.offset} onChange={(offset) => onUpdate(f.id, offset)} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function FramePanel() {
  const [open, setOpen] = useState(false)
  const toolFrames = useFramesStore((s) => s.toolFrames)
  const userFrames = useFramesStore((s) => s.userFrames)
  const activeToolFrameId = useFramesStore((s) => s.activeToolFrameId)
  const activeUserFrameId = useFramesStore((s) => s.activeUserFrameId)
  const addToolFrame = useFramesStore((s) => s.addToolFrame)
  const addUserFrame = useFramesStore((s) => s.addUserFrame)
  const updateToolFrame = useFramesStore((s) => s.updateToolFrame)
  const updateUserFrame = useFramesStore((s) => s.updateUserFrame)
  const removeToolFrame = useFramesStore((s) => s.removeToolFrame)
  const removeUserFrame = useFramesStore((s) => s.removeUserFrame)
  const setActiveToolFrame = useFramesStore((s) => s.setActiveToolFrame)
  const setActiveUserFrame = useFramesStore((s) => s.setActiveUserFrame)

  const hasActiveFrame = activeToolFrameId !== null || activeUserFrameId !== null

  return (
    <div className="flex flex-col gap-1.5">
      <PendantButton onClick={() => setOpen((v) => !v)} active={open} className="w-full">
        Frames{hasActiveFrame ? ' •' : ''}
      </PendantButton>
      {open && (
        <div className="flex flex-col gap-2">
          <FrameGroup
            title="Tool Frames"
            frames={toolFrames}
            activeId={activeToolFrameId}
            onAdd={() => addToolFrame(`Tool ${toolFrames.length + 1}`)}
            onSetActive={setActiveToolFrame}
            onUpdate={updateToolFrame}
            onRemove={removeToolFrame}
          />
          <FrameGroup
            title="User Frames"
            frames={userFrames}
            activeId={activeUserFrameId}
            onAdd={() => addUserFrame(`User ${userFrames.length + 1}`)}
            onSetActive={setActiveUserFrame}
            onUpdate={updateUserFrame}
            onRemove={removeUserFrame}
          />
        </div>
      )}
    </div>
  )
}
