import type { ButtonHTMLAttributes } from 'react'

/**
 * PendantButton — Phase 2 · Unit 1.
 *
 * The shared hard-edged "physical" button of the teach pendant (ui-context.md:
 * rounded-sm pendant buttons, monospaced/uppercase labels). Variants map to the
 * safety palette; `active` flips a toggle button (e.g. HOLD) to its engaged fill.
 * Purely presentational — callers wire behaviour.
 */
export type PendantButtonVariant = 'default' | 'amber' | 'danger' | 'ready'

interface PendantButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PendantButtonVariant
  active?: boolean
}

const BASE =
  'inline-flex select-none items-center justify-center gap-1.5 rounded-sm border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40'

const VARIANTS: Record<PendantButtonVariant, { idle: string; active: string }> = {
  default: {
    idle: 'border-border-default bg-surface-2 text-primary hover:border-border-emphasis',
    active: 'border-amber bg-surface-2 text-amber',
  },
  amber: {
    idle: 'border-border-emphasis bg-surface-2 text-amber hover:border-amber',
    active: 'border-amber bg-amber text-[color:var(--bg-base)]',
  },
  danger: {
    idle: 'border-error bg-surface-2 text-error hover:bg-error hover:text-primary',
    active: 'border-error bg-error text-primary',
  },
  ready: {
    idle: 'border-ready bg-surface-2 text-ready hover:bg-ready hover:text-[color:var(--bg-base)]',
    active: 'border-ready bg-ready text-[color:var(--bg-base)]',
  },
}

export function PendantButton({
  variant = 'default',
  active = false,
  className = '',
  type = 'button',
  ...props
}: PendantButtonProps) {
  const styles = VARIANTS[variant]
  return (
    <button
      type={type}
      className={`${BASE} ${active ? styles.active : styles.idle} ${className}`}
      {...props}
    />
  )
}
