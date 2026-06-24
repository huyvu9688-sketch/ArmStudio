import { Suspense } from 'react'
import { Viewport } from './scene/Viewport'
import { ViewportOverlay } from './scene/ViewportOverlay'
import { Pendant } from './pendant/Pendant'
import { StatusStrip } from './pendant/StatusStrip'
import { ProgramEditor } from './program/ProgramEditor'
import { CellBrowser } from './cell/CellBrowser'
import { importCadFiles } from './cad/importCadFile'
import { dropPointOnFloor } from './scene/dropToFloor'

/**
 * App shell.
 *
 * The four layout regions from ui-context.md: top status strip (live, Phase 2),
 * left Cell Browser rail (live, Phase 5), center 3D viewport, and the
 * right teach pendant (340px, full iPendant panel as of Phase 2).
 */
function App() {
  return (
    <div className="flex h-full flex-col bg-base text-primary">
      {/* Top status strip — spans full width, wired to live state (Phase 2 · Unit 5). */}
      <StatusStrip />

      {/* Body: left rail · viewport · pendant */}
      <div className="flex min-h-0 flex-1">
        {/* Left rail — Cell Browser (Phase 5 · Unit 1) */}
        <aside className="w-60 shrink-0 overflow-y-auto border-r border-border-default bg-surface p-3">
          <h2 className="text-faint mb-2 text-xs font-semibold uppercase tracking-widest">
            Cell
          </h2>
          <CellBrowser />
        </aside>

        {/* Center — 3D viewport (scene shell) with HTML overlay controls */}
        <main
          className="relative min-w-0 flex-1 bg-well"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const files = Array.from(e.dataTransfer.files)
            if (files.length === 0) return
            const canvas = e.currentTarget.querySelector('canvas')
            const position = canvas ? dropPointOnFloor(e.clientX, e.clientY, canvas) : null
            void importCadFiles(files, position ?? undefined)
          }}
        >
          <Suspense
            fallback={
              <div className="absolute inset-0 grid place-items-center">
                <p className="text-faint font-mono text-sm">loading scene…</p>
              </div>
            }
          >
            <Viewport />
          </Suspense>
          <ViewportOverlay />
          <ProgramEditor />
        </main>

        {/* Right — teach pendant (Phase 2). */}
        <aside className="flex w-[340px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-border-default bg-surface p-3">
          <div>
            <h2 className="text-faint text-xs font-semibold uppercase tracking-widest">
              Teach Pendant
            </h2>
            <p className="text-faint mt-0.5 text-[11px]">iPendant-style jog · Phase 2</p>
          </div>
          <Pendant />
        </aside>
      </div>
    </div>
  )
}

export default App
