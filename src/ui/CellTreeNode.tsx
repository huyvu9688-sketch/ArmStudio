import { ChevronDown, ChevronRight, X } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * CellTreeNode — Phase 5 · Unit 1 (tree) + Unit 2 (delete on imported leaves).
 *
 * Two flavors of one row for the Cell Browser tree (ui-context.md mock):
 * a collapsible section header (▸/▾ + label, optionally a count) and a leaf
 * (a colored dot for its kind + name, selectable, optionally deletable).
 * Presentational only — the Cell Browser owns expand/select/import state.
 */
interface SectionProps {
  label: string
  expanded: boolean
  onToggle: () => void
  count?: number
  children?: ReactNode
}

export function CellTreeSection({ label, expanded, onToggle, count, children }: SectionProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-1 rounded-sm py-1 text-left text-xs font-semibold uppercase tracking-wide text-muted hover:text-primary"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {label}
        {count !== undefined && <span className="text-faint font-mono">({count})</span>}
      </button>
      {expanded && <div className="ml-4 flex flex-col">{children}</div>}
    </div>
  )
}

interface LeafProps {
  label: string
  dotColor?: string
  selected?: boolean
  onSelect?: () => void
  onDelete?: () => void
}

export function CellTreeLeaf({ label, dotColor, selected = false, onSelect, onDelete }: LeafProps) {
  return (
    <div
      className={`group flex items-center gap-2 rounded-sm px-1 py-1 text-sm transition-colors ${
        selected ? 'bg-surface-2 text-primary' : 'text-muted hover:text-primary'
      }`}
    >
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        {dotColor && (
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dotColor }} />
        )}
        <span className="truncate">{label}</span>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${label}`}
          className="shrink-0 text-error opacity-0 hover:text-primary group-hover:opacity-100"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
