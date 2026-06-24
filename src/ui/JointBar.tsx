/**
 * JointBar — Phase 2 · Unit 2.
 *
 * A thin limit bar showing where a joint sits within its travel range. The fill
 * width maps the current angle from min→max; it turns red when the joint is
 * within `warnFrac` of either limit (a quick "near a hard stop" cue). Carries
 * the limit information that the Unit-7 sliders showed, now alongside the +/-
 * jog buttons.
 */
interface JointBarProps {
  value: number
  min: number
  max: number
  /** Fraction of total travel within which to flag the joint as near a limit. */
  warnFrac?: number
}

export function JointBar({ value, min, max, warnFrac = 0.05 }: JointBarProps) {
  const span = max - min || 1
  const frac = Math.min(1, Math.max(0, (value - min) / span))
  const marginFrac = Math.min(value - min, max - value) / span
  const nearLimit = marginFrac <= warnFrac
  const color = nearLimit ? 'var(--state-error)' : 'var(--accent-amber)'

  return (
    <div
      role="meter"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      className="relative h-1.5 w-full overflow-hidden rounded-full bg-well"
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${frac * 100}%`, background: color }}
      />
    </div>
  )
}
