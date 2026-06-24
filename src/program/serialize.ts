import type { Program } from '../types'
import { migrateProgram } from './migrate'

/**
 * Program serialization — Phase 4 · Unit 4. Pure (no React/DOM); the editor
 * wires these to file-download/file-picker plumbing.
 */
export function serializeProgram(program: Program): string {
  return JSON.stringify(program, null, 2)
}

/** Parse + validate a `.json` program file. Throws `ProgramMigrationError` on anything malformed. */
export function deserializeProgram(json: string): Program {
  return migrateProgram(JSON.parse(json))
}

/**
 * `.tp` text export — a FANUC-pendant-flavored program listing. Write-only
 * documentation (code-standards.md: parsing TP text back in is out of scope).
 */
export function exportTp(program: Program): string {
  const lines: string[] = [`/PROG  ${program.name}`, '/MN']

  program.instructions.forEach((ins, i) => {
    const n = i + 1
    switch (ins.kind) {
      case 'MOVJ':
      case 'MOVL': {
        const wp = program.waypoints.find((w) => w.id === ins.waypointId)
        lines.push(`   ${n}:${ins.kind} P[${wp ? wp.name : ins.waypointId}]    ${ins.speedPct}%`)
        break
      }
      case 'WAIT':
        lines.push(`   ${n}:WAIT   ${ins.seconds.toFixed(2)}sec`)
        break
      case 'CALL':
        lines.push(`   ${n}:CALL   ${ins.programId}`)
        break
    }
  })

  lines.push('/POS')
  program.waypoints.forEach((wp) => {
    const { x, y, z, rx, ry, rz } = wp.pose
    lines.push(
      `P[${wp.name}]{`,
      `   X =   ${x.toFixed(2)}  mm   Y =   ${y.toFixed(2)}  mm   Z =   ${z.toFixed(2)}  mm`,
      `   W =   ${rx.toFixed(2)}  deg  P =   ${ry.toFixed(2)}  deg  R =   ${rz.toFixed(2)}  deg`,
      '};',
    )
  })
  lines.push('/END')

  return lines.join('\n')
}
