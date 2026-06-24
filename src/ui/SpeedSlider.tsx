/**
 * SpeedSlider — Phase 2 · Unit 1.
 *
 * Labeled range input for the speed override (and any 0-100 % control). Amber
 * accent and a monospaced percentage readout (ui-context.md). Presentational:
 * the caller owns the value and the change handler.
 */
interface SpeedSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  ariaLabel?: string
}

export function SpeedSlider({
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  label = 'Speed',
  ariaLabel = 'Speed override',
}: SpeedSliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-faint text-[11px] font-semibold uppercase tracking-widest">
          {label}
        </span>
        <span className="text-amber font-mono text-xs tabular-nums">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        aria-label={ariaLabel}
        style={{ accentColor: 'var(--accent-amber)' }}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-well"
      />
    </div>
  )
}
