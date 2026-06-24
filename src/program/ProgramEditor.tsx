import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useMachineStore } from '../state/machineStore'
import { usePendantStore } from '../state/pendantStore'
import { usePlaybackStore } from '../state/playbackStore'
import { useProgramStore } from '../state/programStore'
import { useSettingsStore } from '../state/settingsStore'
import { PendantButton } from '../ui/PendantButton'
import { ProgramMigrationError } from './migrate'
import { deserializeProgram, exportTp, serializeProgram } from './serialize'
import { useProgramPlayback } from './useProgramPlayback'
import type { Instruction } from '../types'

/**
 * Program editor — Phase 4 · Unit 2 (editor), Unit 3 (playback), Unit 4
 * (Save/Load/.tp).
 *
 * A right-side drawer (ui-context.md) over the active program built by
 * `programStore`: the waypoints taught via TEACH, and the MOVJ/MOVL/WAIT
 * instruction sequence over them, plus Run/Step/Pause/Stop/Loop playback
 * (`useProgramPlayback`) with the active line highlighted amber, and
 * Save/Load (`.json`, validated at the boundary via `migrate.ts`) / `.tp`
 * text export (write-only documentation). Editing (including Load) is
 * disabled while a run is in flight to avoid mutating a program mid-playback.
 * CALL has no UI yet (no second program exists to call).
 */
function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function instructionLabel(instruction: Instruction, waypointName: (id: string) => string): string {
  switch (instruction.kind) {
    case 'MOVJ':
      return `MOVJ ${waypointName(instruction.waypointId)} ${instruction.speedPct}%`
    case 'MOVL':
      return `MOVL ${waypointName(instruction.waypointId)} ${instruction.speedPct}%`
    case 'WAIT':
      return `WAIT ${instruction.seconds.toFixed(2)}s`
    case 'CALL':
      return `CALL ${instruction.programId}`
  }
}

export function ProgramEditor() {
  const open = useSettingsStore((s) => s.programEditorOpen)
  const close = useSettingsStore((s) => s.toggleProgramEditor)
  const program = useProgramStore((s) => s.program)
  const addMoveJ = useProgramStore((s) => s.addMoveJ)
  const addMoveL = useProgramStore((s) => s.addMoveL)
  const addWait = useProgramStore((s) => s.addWait)
  const removeInstruction = useProgramStore((s) => s.removeInstruction)
  const removeWaypoint = useProgramStore((s) => s.removeWaypoint)
  const moveInstruction = useProgramStore((s) => s.moveInstruction)
  const loadProgram = useProgramStore((s) => s.loadProgram)
  const speedPct = usePendantStore((s) => s.speedPct)
  const [waitSeconds, setWaitSeconds] = useState('0.50')
  const [loadError, setLoadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { run, step, pause, stop } = useProgramPlayback()
  const running = usePlaybackStore((s) => s.running)
  const currentIndex = usePlaybackStore((s) => s.currentIndex)
  const loop = usePlaybackStore((s) => s.loop)
  const toggleLoop = usePlaybackStore((s) => s.toggleLoop)
  const lastError = usePlaybackStore((s) => s.lastError)
  const estop = useMachineStore((s) => s.estop)

  if (!open) return null

  const hasInstructions = program.instructions.length > 0
  const editingLocked = running

  const waypointName = (id: string) => program.waypoints.find((w) => w.id === id)?.name ?? '?'

  const handleSave = () => {
    downloadTextFile(`${program.name || 'program'}.json`, serializeProgram(program))
  }
  const handleExportTp = () => {
    downloadTextFile(`${program.name || 'program'}.tp`, exportTp(program))
  }
  const handleLoadFile = async (file: File) => {
    setLoadError(null)
    try {
      loadProgram(deserializeProgram(await file.text()))
    } catch (e) {
      setLoadError(e instanceof ProgramMigrationError ? e.message : 'invalid JSON')
    }
  }

  return (
    <div className="absolute inset-y-0 right-0 z-20 flex w-[380px] flex-col gap-3 border-l border-border-default bg-surface p-3 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-faint text-xs font-semibold uppercase tracking-widest">
            Program: <span className="text-primary">{program.name}</span>
          </h2>
          <p className="text-faint mt-0.5 text-[11px]">{program.instructions.length} instructions</p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close program editor"
          className="rounded-md p-1 text-muted hover:text-primary"
        >
          <X size={16} />
        </button>
      </div>

      {/* Save / Load / .tp — Phase 4 · Unit 4. */}
      <div className="flex items-center gap-1.5">
        <PendantButton className="flex-1" onClick={handleSave}>
          Save
        </PendantButton>
        <PendantButton className="flex-1" disabled={editingLocked} onClick={() => fileInputRef.current?.click()}>
          Load
        </PendantButton>
        <PendantButton className="flex-1" onClick={handleExportTp}>
          .tp
        </PendantButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void handleLoadFile(file)
          }}
        />
      </div>
      {loadError && (
        <p className="text-error font-mono text-[10px] uppercase tracking-wide">⚠ {loadError}</p>
      )}

      {/* Instruction list */}
      <div className="flex flex-col gap-1 overflow-y-auto rounded-md border border-border-default bg-well p-2 font-mono text-xs">
        {program.instructions.length === 0 ? (
          <p className="text-faint p-2">No instructions yet. Teach a point, then add a move below.</p>
        ) : (
          program.instructions.map((ins, i) => {
            const active = running && i === currentIndex
            return (
              <div
                key={ins.id}
                className={[
                  'flex items-center justify-between gap-2 rounded-sm px-1.5 py-1',
                  active ? 'bg-amber/15 text-amber' : 'hover:bg-surface-2',
                ].join(' ')}
              >
                <span className="text-faint w-5 shrink-0 text-right">{i + 1}</span>
                <span className={`flex-1 ${active ? 'text-amber' : 'text-primary'}`}>
                  {instructionLabel(ins, waypointName)}
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    disabled={editingLocked || i === 0}
                    onClick={() => moveInstruction(i, i - 1)}
                    className="rounded-sm px-1 text-muted hover:text-primary disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={editingLocked || i === program.instructions.length - 1}
                    onClick={() => moveInstruction(i, i + 1)}
                    className="rounded-sm px-1 text-muted hover:text-primary disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={editingLocked}
                    onClick={() => removeInstruction(ins.id)}
                    className="rounded-sm px-1 text-error hover:text-primary disabled:opacity-30"
                    aria-label="Delete instruction"
                  >
                    ×
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Playback — Phase 4 · Unit 3. */}
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-4 gap-1.5">
          <PendantButton
            variant="ready"
            disabled={estop || !hasInstructions || running}
            onClick={run}
          >
            ▶ Run
          </PendantButton>
          <PendantButton variant="amber" disabled={!running} onClick={pause}>
            ⏸
          </PendantButton>
          <PendantButton
            variant="danger"
            disabled={!running && currentIndex === 0}
            onClick={stop}
          >
            ⏹
          </PendantButton>
          <PendantButton disabled={estop || !hasInstructions || running} onClick={step}>
            ↓ Step
          </PendantButton>
        </div>
        <div className="flex items-center justify-between">
          <PendantButton variant="amber" active={loop} onClick={toggleLoop} className="text-[10px]">
            Loop {loop ? '●' : '○'}
          </PendantButton>
          {lastError && (
            <span className="text-error font-mono text-[10px] uppercase tracking-wide">
              ⚠ {lastError}
            </span>
          )}
        </div>
      </div>

      <div className="h-px bg-border-default" />

      {/* Waypoints — taught via the pendant's TEACH button. */}
      <div>
        <h3 className="text-faint mb-1.5 text-[11px] font-semibold uppercase tracking-widest">
          Waypoints
        </h3>
        {program.waypoints.length === 0 ? (
          <p className="text-faint text-xs">
            Press <span className="text-amber">TEACH</span> on the pendant to record one.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {program.waypoints.map((wp) => (
              <div
                key={wp.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border-default bg-well px-2 py-1.5"
              >
                <span className="font-mono text-xs text-primary">{wp.name}</span>
                <span className="text-faint font-mono text-[10px]">
                  {wp.pose.x.toFixed(0)},{wp.pose.y.toFixed(0)},{wp.pose.z.toFixed(0)} mm
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={editingLocked}
                    onClick={() => addMoveJ(wp.id, speedPct)}
                    title="Add MOVJ to this waypoint"
                    className="rounded-sm border border-border-default px-1.5 py-0.5 text-[10px] font-semibold text-muted hover:border-border-emphasis hover:text-primary disabled:opacity-30"
                  >
                    +J
                  </button>
                  <button
                    type="button"
                    disabled={editingLocked}
                    onClick={() => addMoveL(wp.id, speedPct)}
                    title="Add MOVL to this waypoint"
                    className="rounded-sm border border-border-default px-1.5 py-0.5 text-[10px] font-semibold text-muted hover:border-border-emphasis hover:text-primary disabled:opacity-30"
                  >
                    +L
                  </button>
                  <button
                    type="button"
                    disabled={editingLocked}
                    onClick={() => removeWaypoint(wp.id)}
                    title="Delete waypoint"
                    className="rounded-sm px-1 text-error hover:text-primary disabled:opacity-30"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-border-default" />

      {/* WAIT */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.1"
          min="0"
          disabled={editingLocked}
          value={waitSeconds}
          onChange={(e) => setWaitSeconds(e.target.value)}
          className="w-20 rounded-md border border-border-default bg-well px-2 py-1.5 font-mono text-xs text-primary disabled:opacity-30"
        />
        <span className="text-faint text-xs">sec</span>
        <PendantButton
          className="ml-auto"
          disabled={editingLocked}
          onClick={() => {
            const seconds = Math.max(0, Number(waitSeconds) || 0)
            addWait(seconds)
          }}
        >
          + Wait
        </PendantButton>
      </div>
    </div>
  )
}
