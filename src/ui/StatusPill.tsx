/**
 * StatusPill — Phase 2 · Unit 5.
 *
 * A colored-dot + label pill for the status strip (robot status, connection,
 * etc.). Tone maps to the safety/state palette; `pulse` animates the dot for
 * live conditions (moving, E-STOP). Connection state reuses this until a
 * dedicated panel arrives in Phase 7.
 */
export type StatusTone = 'ready' | 'moving' | 'hold' | 'error' | 'online' | 'offline' | 'neutral'

const TONE_COLOR: Record<StatusTone, string> = {
  ready: 'var(--state-ready)',
  moving: 'var(--accent-amber)',
  hold: 'var(--state-warning)',
  error: 'var(--state-error)',
  online: 'var(--state-online)',
  offline: 'var(--state-offline)',
  neutral: 'var(--text-muted)',
}

interface StatusPillProps {
  label: string
  tone?: StatusTone
  pulse?: boolean
}

export function StatusPill({ label, tone = 'neutral', pulse = false }: StatusPillProps) {
  const color = TONE_COLOR[tone]
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide"
      style={{ color }}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${pulse ? 'animate-pulse' : ''}`}
        style={{ background: color }}
      />
      {label}
    </span>
  )
}
