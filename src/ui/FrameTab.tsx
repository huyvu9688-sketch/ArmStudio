/**
 * FrameTab — Phase 2 · Unit 1.
 *
 * A segmented-control tab used by the frame selector and the jog mode / step
 * pickers. Active = amber fill; disabled tabs are dimmed and non-interactive
 * (used for the Cartesian frames that need IK in Phase 3). Width is controlled
 * by the caller via `className` (e.g. `flex-1` for equal-width segments).
 */
interface FrameTabProps {
  label: string
  active: boolean
  disabled?: boolean
  title?: string
  className?: string
  onClick?: () => void
}

const BASE =
  'select-none rounded-sm border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors'

export function FrameTab({
  label,
  active,
  disabled = false,
  title,
  className = '',
  onClick,
}: FrameTabProps) {
  const state = disabled
    ? 'cursor-not-allowed border-border-default bg-surface-2 text-faint opacity-50'
    : active
      ? 'border-amber bg-amber text-[color:var(--bg-base)]'
      : 'border-border-default bg-surface-2 text-muted hover:border-border-emphasis hover:text-primary'

  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      aria-pressed={active}
      className={`${BASE} ${state} ${className}`}
    >
      {label}
    </button>
  )
}
