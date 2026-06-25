import { useRef, type PointerEvent as ReactPointerEvent } from 'react'

/**
 * JointBar — Phase 2 · Unit 2, draggable as of this revision.
 *
 * A thin bar showing where a value sits within `[min, max]`. For a real
 * travel limit (joints) it turns red within `warnFrac` of either end — a
 * "near a hard stop" cue. Pass `limitWarning={false}` when `min`/`max` are
 * just an arbitrary display window rather than a physical limit (e.g. the
 * Cartesian jog's ±700 mm / ±180° range) — otherwise an ordinary value that
 * happens to sit at that window's edge (Rx = 180° at home, say) falsely
 * reads as "near limit". A round thumb sits at the current value as the
 * visible drag handle.
 *
 * When `onChange` is supplied, the whole row is a drag target: pressing and
 * dragging anywhere along it sets the value proportionally to pointer
 * position (instant set, same "go straight there" semantics as
 * `EditableAngle` — not a jog), not just the thumb itself — the thumb is
 * `pointer-events-none` so it can't shadow-block hits. Pointer capture keeps
 * the drag tracking even if the pointer slides off the track's bounds.
 */
interface JointBarProps {
  value: number
  min: number
  max: number
  /** Fraction of total travel within which to flag the value as near a limit. */
  warnFrac?: number
  /** Set false when min/max is a display window, not a real travel limit. */
  limitWarning?: boolean
  onChange?: (value: number) => void
  /** Fires once when a drag starts, before the first `onChange` of that drag. */
  onDragStart?: () => void
  /** Fires once when a drag ends (pointerup/cancel/leave-without-button). */
  onDragEnd?: () => void
  disabled?: boolean
}

export function JointBar({
  value,
  min,
  max,
  warnFrac = 0.05,
  limitWarning = true,
  onChange,
  onDragStart,
  onDragEnd,
  disabled = false,
}: JointBarProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const span = max - min || 1
  const frac = Math.min(1, Math.max(0, (value - min) / span))
  const marginFrac = Math.min(value - min, max - value) / span
  const nearLimit = limitWarning && marginFrac <= warnFrac
  const color = nearLimit ? 'var(--state-error)' : 'var(--accent-amber)'

  function valueAtPointer(e: ReactPointerEvent<HTMLDivElement>) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return value
    const t = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    return min + t * span
  }

  function startDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || !onChange) return
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* pointer capture unsupported — drag still tracks via pointermove */
    }
    onDragStart?.()
    onChange(valueAtPointer(e))
  }

  function drag(e: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || !onChange) return
    if (e.buttons === 0) return
    onChange(valueAtPointer(e))
  }

  function endDrag() {
    onDragEnd?.()
  }

  return (
    <div
      role="slider"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-disabled={disabled || !onChange}
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`relative flex h-4 w-full items-center ${onChange && !disabled ? 'cursor-pointer' : ''}`}
    >
      <div ref={trackRef} className="relative h-1.5 w-full overflow-hidden rounded-full bg-well">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${frac * 100}%`, background: color }}
        />
      </div>
      <div
        className="pointer-events-none absolute top-1/2 h-[14.4px] w-[14.4px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: `${frac * 100}%`, background: color }}
      />
    </div>
  )
}
