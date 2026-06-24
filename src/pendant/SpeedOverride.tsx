import { SPEED_MAX, SPEED_MIN, usePendantStore } from '../state/pendantStore'
import { SpeedSlider } from '../ui/SpeedSlider'

/**
 * Speed override — Phase 2 · Unit 3.
 *
 * Binds the speed slider to the pendant store. The percentage scales the
 * continuous jog rate live (useJog reads it each frame) and will scale program
 * playback speed in later phases.
 */
export function SpeedOverride() {
  const speedPct = usePendantStore((s) => s.speedPct)
  const setSpeedPct = usePendantStore((s) => s.setSpeedPct)

  return (
    <SpeedSlider
      value={speedPct}
      onChange={setSpeedPct}
      min={SPEED_MIN}
      max={SPEED_MAX}
      label="Speed override"
    />
  )
}
