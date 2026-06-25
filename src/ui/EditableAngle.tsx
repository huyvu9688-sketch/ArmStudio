import { useEffect, useRef, useState } from 'react'

/**
 * EditableAngle — click-to-edit numeric readout.
 *
 * Renders as plain text (matches the existing amber angle readout) until
 * clicked, then swaps to a number input pre-filled with the current value.
 * Enter/blur commits the clamped value via `onCommit`; Escape cancels without
 * calling it. Presentational — callers own clamping/limits and the actual
 * state write (direct `setAngle`, not a jog), per code-standards.md.
 */
interface EditableAngleProps {
  value: number
  onCommit: (value: number) => void
  disabled?: boolean
  /** Suffix shown in the idle label, e.g. "°" or " mm". Defaults to "°". */
  unit?: string
}

export function EditableAngle({ value, onCommit, disabled = false, unit = '°' }: EditableAngleProps) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function startEdit() {
    if (disabled) return
    setText(value.toFixed(1))
    setEditing(true)
  }

  function commit() {
    const parsed = Number(text)
    if (Number.isFinite(parsed)) onCommit(parsed)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step={0.1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setEditing(false)
        }}
        className="bg-well text-amber w-16 rounded px-1 text-right font-mono text-xs tabular-nums outline-none"
      />
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={startEdit}
      className="text-amber tabular-nums hover:underline disabled:cursor-not-allowed disabled:no-underline"
      title="Click to enter an exact value"
    >
      {value.toFixed(1)}
      {unit}
    </button>
  )
}
