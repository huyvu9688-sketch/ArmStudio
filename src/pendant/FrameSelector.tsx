import { usePendantStore, type JogFrame } from '../state/pendantStore'
import { FrameTab } from '../ui/FrameTab'

/**
 * Frame selector — Phase 2 · Unit 3, User enabled in Phase 5 · Unit 6.
 *
 * Picks the jog reference frame. Joint/World/Tool/User all edit the TCP
 * pose via IK (`CartesianJog`'s drag-bar/exact-entry rows); User additionally
 * needs an active registered frame (`framesStore`) — register one in the
 * Frames panel.
 */
const FRAMES: { id: JogFrame; label: string }[] = [
  { id: 'joint', label: 'Joint' },
  { id: 'world', label: 'World' },
  { id: 'tool', label: 'Tool' },
  { id: 'user', label: 'User' },
]

export function FrameSelector() {
  const activeFrame = usePendantStore((s) => s.activeFrame)
  const setFrame = usePendantStore((s) => s.setFrame)

  return (
    <div className="flex flex-col gap-1">
      <span className="text-faint text-[11px] font-semibold uppercase tracking-widest">Frame</span>
      <div className="flex gap-1">
        {FRAMES.map((f) => (
          <FrameTab
            key={f.id}
            label={f.label}
            active={activeFrame === f.id}
            title={`Jog in ${f.label} frame`}
            className="flex-1"
            onClick={() => setFrame(f.id)}
          />
        ))}
      </div>
    </div>
  )
}
