import { usePendantStore, type JogFrame } from '../state/pendantStore'
import { FrameTab } from '../ui/FrameTab'

/**
 * Frame selector — Phase 2 · Unit 3.
 *
 * Picks the jog reference frame. Joint, World, and Tool are active as of Phase 3
 * (Cartesian jog solves IK live). User frame stays disabled until user-frame
 * registration lands in Phase 5.
 */
const FRAMES: { id: JogFrame; label: string; enabled: boolean }[] = [
  { id: 'joint', label: 'Joint', enabled: true },
  { id: 'world', label: 'World', enabled: true },
  { id: 'tool', label: 'Tool', enabled: true },
  { id: 'user', label: 'User', enabled: false },
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
            disabled={!f.enabled}
            title={f.enabled ? `Jog in ${f.label} frame` : 'User frame needs registration — Phase 5'}
            className="flex-1"
            onClick={() => setFrame(f.id)}
          />
        ))}
      </div>
    </div>
  )
}
