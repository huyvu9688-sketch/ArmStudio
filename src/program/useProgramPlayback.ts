import { useCallback, useEffect, useRef } from 'react'
import { useMachineStore } from '../state/machineStore'
import { usePendantStore } from '../state/pendantStore'
import { usePlaybackStore } from '../state/playbackStore'
import { useProgramStore } from '../state/programStore'
import { useMotion, type MoveOutcome } from './useMotion'

/**
 * Program playback — Phase 4 · Unit 3.
 *
 * Sequences the active program's instructions over `useMotion` (the Phase 3
 * MOVJ/MOVL engine): Run plays from the current line to the end (looping if
 * `loop` is set), Step plays exactly one line and halts, Pause/Stop reuse the
 * existing `machineStore` hold/abort plumbing so E-STOP and HOLD interrupt
 * playback exactly like a jog. Each MOVJ/MOVL line applies its own recorded
 * `speedPct` as the active speed override for the duration of that move
 * (mirrors a real pendant: each program line's % becomes the live override).
 *
 * CALL has no resolvable target yet (no second program exists to call) — it
 * logs and advances rather than blocking the sequence.
 */
type MoveFailureReason = Exclude<MoveOutcome, { done: true }>['reason']

const FAILURE_LABEL: Record<MoveFailureReason, string> = {
  aborted: 'aborted (E-STOP/Hold)',
  singular: 'singularity',
  limit: 'joint limit',
  unreachable: 'out of reach',
}

type Executor = (index: number, mode: 'run' | 'step', token: number) => void

export function useProgramPlayback() {
  const { runMove, cancelMove } = useMotion()
  // Bumped by run()/step()/stop() so a stale async continuation (a move or
  // WAIT timer outliving a Stop/new Run) can recognize it's been superseded.
  const tokenRef = useRef(0)
  // The recursive step driver. It's rebuilt in an effect (refs aren't mutated
  // during render here) and called through the ref so the recursive calls
  // inside it always reach the current closure rather than a stale one.
  const executeAtRef = useRef<Executor>(() => {})

  useEffect(() => {
    const executeAt: Executor = (index, mode, token) => {
      if (useMachineStore.getState().estop) {
        usePlaybackStore.getState().setRunning(false)
        return
      }
      const { program } = useProgramStore.getState()

      if (index >= program.instructions.length) {
        if (mode === 'run' && usePlaybackStore.getState().loop && program.instructions.length > 0) {
          executeAtRef.current(0, mode, token)
        } else {
          usePlaybackStore.getState().reset()
        }
        return
      }

      usePlaybackStore.getState().setCurrentIndex(index)
      usePlaybackStore.getState().setLastError(null)
      const ins = program.instructions[index]

      const advance = () => {
        if (tokenRef.current !== token) return
        if (mode === 'step') {
          usePlaybackStore.getState().setCurrentIndex(Math.min(index + 1, program.instructions.length))
          usePlaybackStore.getState().setRunning(false)
        } else {
          executeAtRef.current(index + 1, mode, token)
        }
      }

      const fail = (label: string) => {
        if (tokenRef.current !== token) return
        usePlaybackStore.getState().setLastError(label)
        usePlaybackStore.getState().setRunning(false)
      }

      switch (ins.kind) {
        case 'MOVJ':
        case 'MOVL': {
          const waypoint = program.waypoints.find((w) => w.id === ins.waypointId)
          if (!waypoint) {
            fail('waypoint deleted')
            return
          }
          usePendantStore.getState().setSpeedPct(ins.speedPct)
          const plan =
            ins.kind === 'MOVJ'
              ? ({ type: 'MOVJ' as const, toAngles: waypoint.angles })
              : ({ type: 'MOVL' as const, toPose: waypoint.pose })
          runMove(plan, (outcome) => {
            if (tokenRef.current !== token) return
            if (outcome.done) advance()
            else fail(FAILURE_LABEL[outcome.reason])
          })
          break
        }
        case 'WAIT': {
          window.setTimeout(() => {
            if (tokenRef.current !== token) return
            advance()
          }, Math.max(0, ins.seconds * 1000))
          break
        }
        case 'CALL': {
          console.warn(
            `CALL ${ins.programId}: sub-programs aren't implemented yet — skipping.`,
          )
          advance()
          break
        }
      }
    }
    executeAtRef.current = executeAt
  }, [runMove])

  const run = useCallback(() => {
    if (useMachineStore.getState().estop) return
    useMachineStore.getState().setHold(false)
    usePlaybackStore.getState().setRunning(true)
    const token = ++tokenRef.current
    executeAtRef.current(usePlaybackStore.getState().currentIndex, 'run', token)
  }, [])

  const step = useCallback(() => {
    if (useMachineStore.getState().estop) return
    useMachineStore.getState().setHold(false)
    usePlaybackStore.getState().setRunning(true)
    const token = ++tokenRef.current
    executeAtRef.current(usePlaybackStore.getState().currentIndex, 'step', token)
  }, [])

  /** Pause reuses the shared motion hold — identical to pressing HOLD on the pendant. */
  const pause = useCallback(() => {
    useMachineStore.getState().setHold(true)
  }, [])

  const stop = useCallback(() => {
    tokenRef.current++
    cancelMove()
    usePlaybackStore.getState().reset()
  }, [cancelMove])

  useEffect(() => stop, [stop])

  return { run, step, pause, stop }
}
