import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { Minus, Plus } from 'lucide-react'

/**
 * JogButton — Phase 2 · Unit 2.
 *
 * A hold-to-jog +/- button. Pointer-down starts the jog, pointer-up/leave/cancel
 * stops it — so in continuous mode the joint moves while held, and in incremental
 * mode `onJogStart` fires the single step (the hook ignores the stop). Pointer
 * capture keeps the release event on this button even if the finger slides off.
 * Presentational: the caller (useJog) owns what start/stop do.
 */
interface JogButtonProps {
  direction: 1 | -1
  onJogStart: () => void
  onJogStop: () => void
  disabled?: boolean
  ariaLabel?: string
}

export function JogButton({
  direction,
  onJogStart,
  onJogStop,
  disabled = false,
  ariaLabel,
}: JogButtonProps) {
  const Icon = direction > 0 ? Plus : Minus
  const pressing = useRef(false)

  const start = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (disabled) return
    e.preventDefault()
    pressing.current = true
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* pointer capture unsupported — pointerup still fires on the button */
    }
    onJogStart()
  }

  const stop = () => {
    if (!pressing.current) return
    pressing.current = false
    onJogStop()
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      className="flex h-9 w-9 items-center justify-center rounded-sm border border-border-emphasis bg-surface-2 text-primary transition-colors hover:border-amber hover:text-amber active:bg-amber active:text-[color:var(--bg-base)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border-emphasis disabled:hover:text-primary"
    >
      <Icon size={16} strokeWidth={2.5} />
    </button>
  )
}
