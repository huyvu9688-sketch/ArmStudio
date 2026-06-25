# Progress Tracker

Update this file after every meaningful implementation change.

---

## Current Phase

Phase 6 — Study + visualization tools: **PAUSED after Unit 1.** DH frame
gizmos (Unit 1) are built and confirmed working, but they exposed a real,
quantified DH↔GLB geometry mismatch (see below) — Units 2–5 (work envelope,
live DH editor, reach test, singularity map) all build on the same
`DH_PARAMS`, so the user chose to reconcile that table against the real GLB
before continuing rather than build more visualizations on numbers known to
be wrong away from home pose.

Phase 5 — 3D cell + CAD import: **COMPLETE (Units 1–7).**

Phase 4 — Offline programmer: **COMPLETE (Units 1–4).**

Phase 3 — IK + Cartesian + linear moves: **COMPLETE (Units 1–6).**

Phase 2 — Teach pendant: **COMPLETE (Units 1–5).**

Phase 1 — GLB arm, 3D scene, and forward kinematics: **COMPLETE (Units 1–8).**
(Joint jog directions / the 4-DOF model limitation pending final user eyeball,
but functionally done — build + tests green.)

## Current Goal

Phase 5 done. The 3D cell is complete: a Cell Browser tree, STL/OBJ/GLTF CAD
import (file picker + drag-drop), type/color assignment, a drei transform
gizmo + numeric property panel, registered tool/user frames wired into the
pendant's Cartesian jog, and five camera-view presets (Orbit/Front/Side/Top/
TCP-follow).

**Done-when (met):** importing a mesh, positioning it with the gizmo, and
defining a tool frame all work end-to-end; `npm run build`, `npm run lint`,
and `npm run test` (63 tests) all pass. See "Phase 5 done-when met" above for
the full verification and the known gaps carried forward.

Earlier phases: Phase 4 shipped the offline programmer (instructions, TEACH,
Run/Step/Pause/Stop/Loop, Save/Load/.tp). Phase 3 shipped the kinematics
engine (IK, Jacobian, Cartesian jog, MOVJ/MOVL, TCP trail, singularity
warning). Phase 2 shipped the FANUC iPendant-style pendant (frame selector,
jog mode + step, joint +/- jog, speed override, HOLD, latched E-STOP, HOME,
live status strip). Phase 1 shipped the GLB arm + scene + forward kinematics.

## What exists after Phase 1 (handoff snapshot)

- **App shell** (`src/App.tsx`): status strip (static), left Cell Browser rail
  (placeholder), center 3D viewport, right pendant rail (TCP readout + jog
  sliders + HOME).
- **Scene** (`src/scene/`): r3f `Viewport` (grid, lights, orbit cam, gizmo,
  base triad), `Arm` selector (GLB vs primitive, Suspense + error boundary),
  `RobotArm` (GLB load + floor-seat + drives 4 real pivots in one `useFrame`),
  `PrimitiveArm` fallback, `AxisTriad`, `colors.ts`.
- **Kinematics** (`src/kinematics/`, pure): `forward.ts` (`forwardKinematics`,
  `forwardKinematicsMatrix`, `jointTransforms`), `dh.ts` (standard DH), `units.ts`;
  `forward.test.ts` (8 passing, hand-derived ground truth). IK/Jacobian = Phase 3.
- **Config** (`src/config/`): `dh-params.ts` (LOCKED DH/limits/home/node map),
  `glb-joint-map.ts` (model→joint adapter for the 4-DOF GLB; delete on re-rig).
- **State** (`src/state/`): `robotStore.ts` (zustand: `angles`, `setAngle`,
  `setAngles`, `home`; dev `window.__robotStore`).
- **Pendant** (`src/pendant/`): `JointJog.tsx` (6 limit-bounded sliders + HOME),
  `PoseReadout.tsx` (live FK TCP pose).
- **Types** (`src/types.ts`): `JointAngles`, `Pose`, `DHParam`, `JointLimit`,
  `JointAxis`.
- **Known limitations:** supplied GLB is a 4-DOF baked rig — J4/J6 drive the
  store/FK but not the mesh until re-rigged in Blender. World/Tool/User jog needs
  IK (Phase 3); the Phase 2 frame selector ships those as not-yet-active.

---

## Completed

- Context files written and finalized.
- DH parameters locked (`architecture.md`).
- GLB pipeline documented (Sketchfab → gltfjsx).
- Scope decisions locked: CAD import = mesh only (STL/OBJ/GLTF); online link = both transports specced (WebSocket + Web Serial), pick later.
- Roboguide feature parity mapped (`project-overview.md`).
- **Phase 1 · Unit 1 — Scaffold.** Vite + React + TS + r3f deps + Tailwind v4
  installed. Design tokens from `ui-context.md` wired in `src/index.css`
  (canonical `--bg-base` vars + Tailwind `@theme` re-exports; Space Grotesk /
  JetBrains Mono fonts). App shell (`src/App.tsx`) lays out the four regions:
  status strip, Cell Browser rail, 3D viewport, teach pendant. Vitest configured
  (`passWithNoTests` until Unit 8). `npm run build` + `npm run test` pass; dev
  server serves the shell. Scaffold cruft removed; `robot-arm.glb` gitignored.
- **Phase 1 · Unit 2 — Scene shell.** `src/scene/`: `Viewport.tsx` hosts the r3f
  Canvas (meters, Y-up, floor on XZ) with hemisphere+ambient+directional
  lighting, an infinite drei `Grid` (10 cm cells / 0.5 m sections), an orbit
  camera (damped, clamped), and a corner `GizmoViewport`. `AxisTriad.tsx` is a
  reusable X/Y/Z arrow triad (base-frame helper now; DH frame gizmos reuse it in
  Phase 6). `colors.ts` mirrors `ui-context.md` tokens for three.js materials.
  Viewport mounted in `App.tsx` under Suspense. `npm run build` + `npm run test`
  pass; all scene modules transform/serve cleanly under Vite.
- **Phase 1 · Unit 3 — GLB model.** User supplied "Robot 6 Axis" (Sketchfab,
  CC-BY-4.0) at `public/models/robot-arm.glb` (4.3 MB). Ran `gltfjsx --types`:
  model is NOT named `Link1..Link6` — it's a Cinema4D `Null`-empty rig with a
  baked animation; real pivot chain `Null→Null_2→Null_3→Null_4→Null_1→Null_6`,
  `Sphere` = tool tip (recorded in `architecture.md`). `src/scene/`:
  `RobotArm.tsx` (useGLTF + auto-center/floor-drop, casts/receives shadows),
  `PrimitiveArm.tsx` (schematic fallback), `Arm.tsx` (Suspense + error boundary
  → primitive fallback; honors `VITE_ARM_MODEL`). Mounted in `Viewport`.
  `npm run build` + `npm run test` pass; GLB serves 200 at `/models/robot-arm.glb`;
  dev log clean. User visually confirmed arm placement/orientation — looks good.
- **Phase 1 · Unit 4 — DH config.** Created `src/config/dh-params.ts` with
  `DH_PARAMS`, `JOINT_LIMITS`, `HOME_ANGLES`, `JOINT_NODES`, `JOINT_AXES`
  transcribed verbatim from architecture.md (LOCKED; mm + degrees) and typed via
  new `src/types.ts` (`JointAngles`, `DHParam`, `JointLimit`, `JointAxis`) with
  `satisfies` value-checks. `JOINT_NODES` kept as documented `Link1..Link6` with
  a TODO to remap to the model's real `Null` nodes in Unit 6 (per the rig
  decision). `tsc -b` type-checks; `npm run build` + `npm run test` pass. No
  browser-visible change (config only); consumed by FK in Unit 5.
- **Phase 1 · Unit 5 — FK module.** `src/kinematics/` (pure; no React/three/DOM):
  `units.ts` (deg↔rad, mm↔m), `dh.ts` (standard-DH link transform; double-
  precision gl-matrix), `forward.ts` (`forwardKinematics`→`Pose`,
  `forwardKinematicsMatrix`, `jointTransforms`; Euler XYZ extraction matching
  THREE). Added `Pose` to `src/types.ts`. Verified by throwaway diagnostic (now
  deleted): J1 rotates TCP about vertical Z, J2/J3 change height/reach — correct
  arm. Curated FK known-value tests come in Unit 8. `npm run build` + `npm run
  test` pass.
- **Phase 1 · Unit 6 — Drive GLB joints.** Inspected the GLB directly (scratchpad
  scripts): baked animation drives only 4 pivots → model is effectively 4-DOF.
  Recovered each pivot's local axis from the animation keyframes. New
  `src/state/robotStore.ts` (zustand: `angles`, `setAngle`/`setAngles`/`home`;
  dev `window.__robotStore` handle). New `src/config/glb-joint-map.ts` adapter
  (J1→Null_3/X, J2→Null_4/Z, J3→Null_1/X, J5→Null_6/Z; J4/J6 null = inert).
  `RobotArm.tsx` resolves nodes, captures rest quaternions, and poses them in one
  `useFrame` (rest · Rot(localAxis, angle)) reading the store — no axis hardcoded
  in scene (invariant #6). `npm run build` passes; dev server clean. **Awaiting
  user visual confirm** via `__robotStore.getState().setAngle(i, deg)`.
- **Phase 1 · Unit 7 — Jog sliders.** `src/pendant/JointJog.tsx`: six sliders
  (J1..J6) bounded by `JOINT_LIMITS`, bound to the robot store (live `setAngle`)
  + HOME button; presentational only. Mounted in the right rail of `App.tsx`
  (replaces the pendant placeholder; full iPendant is Phase 2). J4/J6 flagged
  "no model pivot" (drive store/FK but not the 4-DOF mesh). Moving a slider poses
  the arm live via Unit 6. `npm run build` + `npm run test` pass; dev server
  clean. Verifies Unit 6 visually too.
- **Phase 1 · Unit 8 — TCP readout + FK tests.** `src/kinematics/forward.test.ts`:
  first real test suite — 4 hand-derived known TCP positions (home, J1/J2/J3 =
  90°) computed analytically from the locked DH table (independent ground truth),
  plus structural props (home orientation = 180° X-flip, J1 preserves height +
  constant radius, reach < 720 mm). 8 tests pass. `src/pendant/PoseReadout.tsx`:
  live FK TCP pose (X/Y/Z mm, Rx/Ry/Rz deg, mono) recomputed on each jog, mounted
  above the jog sliders. `npm run build` + `npm run test` (8) pass.

  **Phase 1 done-when met:** all six joints driven from sliders (J4/J6 store-only
  on this 4-DOF model), TCP pose updates live, build + tests green.

- **Phase 2 · Unit 1 — Pendant state + UI primitives.** New
  `src/state/pendantStore.ts` (zustand: `activeFrame`, `jogMode` cont/incr,
  `stepSize` from `STEP_SIZES`=[1,5,30,90]°, `speedPct` 1–100 clamped; defaults
  joint/continuous/5°/50%). New `src/state/machineStore.ts` (safety/motion:
  `estop` latched, `hold`, `moving`; `engageEstop`/`resetEstop`/`setHold`/
  `toggleHold`/`setMoving`; pure `deriveStatus` with E-STOP>Hold>Moving>Ready
  priority) — introduced here as the shared foundation, its UI lands in Unit 4.
  First `src/ui/` primitives: `PendantButton` (variants default/amber/danger/
  ready + `active` toggle fill), `FrameTab` (segmented tab, disabled state),
  `SpeedSlider` (amber range + mono %).
- **Phase 2 · Unit 2 — Joint jog +/- buttons.** `src/pendant/jogMath.ts` (pure,
  tested: `clampToLimit`, `jogStep`, `jogRateDegPerSec`). `src/pendant/useJog.ts`
  hook: `startJog(joint,dir)`/`stopJog()` — incremental = one `stepSize` step per
  press; continuous = rAF loop integrating a speed-scaled rate (60°/s max, dt
  capped) until release, re-reading stores via `getState()` each frame and
  gating on E-STOP/HOLD; clamps to `JOINT_LIMITS` (invariant #4). `src/ui/
  JogButton.tsx` (hold-to-jog +/- via pointer capture) and `src/ui/JointBar.tsx`
  (limit bar, red near a hard stop). `JointJog.tsx` rewritten from sliders to a
  per-joint row: label, live angle, limit bar + min/max, and −/+ buttons
  (disabled while motion blocked).
- **Phase 2 · Unit 3 — Frame selector + speed.** `FrameSelector.tsx` (Joint
  active; World/Tool/User shown but disabled with a "needs IK — Phase 3"
  tooltip), `JogModeSelector.tsx` (Cont/Incr + step chips, chips disabled in
  continuous), `SpeedOverride.tsx` (binds SpeedSlider to the store; scales the
  continuous jog rate live).
- **Phase 2 · Unit 4 — Safety controls.** `SafetyControls.tsx`: TEACH (disabled
  until Phase 4), HOME (robot store `home`, blocked while motion disabled), HOLD
  (toggle, amber active), and the latched E-STOP (engage on press → pulsing red;
  explicit separate Reset clears the latch). Pressing E-STOP anywhere halts an
  in-flight jog within one frame via the machine-store gate in `useJog`.
- **Phase 2 · Unit 5 — Live status strip.** `StatusStrip.tsx` replaces the static
  Phase-1 header: live FRAME + SPEED from the pendant store, a `StatusPill`
  (new `src/ui/StatusPill.tsx`) reflecting `deriveStatus` (Ready/Moving/Hold/
  E-Stop, pulsing on moving/estop), PROG placeholder (Phase 4), and an Offline
  connection pill (Phase 7). `Pendant.tsx` composes all sections in the
  ui-context.md order; `App.tsx` mounts `StatusStrip` + `Pendant`. Build + 24
  tests + lint green; dev server serves 200.

- **Phase 3 · Unit 1 — Jacobian + manipulability.** `src/kinematics/linalg.ts`
  (pure dense n×n: transpose/matMul/matVec/identity/solve [Gaussian + partial
  pivot]/determinant). `src/kinematics/jacobian.ts`: `computeJacobian` (6×6
  geometric Jacobian from the cumulative DH transforms — Jᵢ = [zᵢ₋₁×(pₑ−pᵢ₋₁); zᵢ₋₁]),
  `manipulability` = |det J|, plus `REFERENCE_MANIPULABILITY` /
  `manipulabilityRatio` / `SINGULARITY_WARN_RATIO` for a scale-free readout.
  Tests cross-check the Jacobian column-by-column against finite-difference FK and
  confirm manipulability collapses at the J5=0 wrist singularity.
- **Phase 3 · Unit 2 — Damped-least-squares IK.** `src/kinematics/rotation.ts`
  (Euler-XYZ↔3×3, so(3) log/exp `rotationVectorFromRot3`/`rot3FromRotationVector`,
  axis rotations — all matching the FK/THREE convention). `src/kinematics/
  inverse.ts`: `inverseKinematics(pose, seed?)` + `inverseKinematicsFromMatrix`
  via Levenberg DLS `(JJᵀ+λ²I)y=e, Δθ=Jᵀy` with a backtracking line search; clamps
  to JOINT_LIMITS each step; returns the typed `IKResult` (`{ok,angles}` |
  `{ok:false, reason:'unreachable'|'singular'|'limit'}`) — `IKResult`/
  `IKFailureReason` added to `types.ts` (invariant #5). Tests: round-trip
  `fk(ik)≈pose` across the workspace, immediate return at the seed, limits
  respected, far target → not-ok.
- **Phase 3 · Unit 3 — Cartesian jog + singularity readout.** `useJog` extended
  with `startCartesianJog(axis,dir)` (renamed `startJog`→`startJointJog`): each
  frame it offsets the current TCP transform along the World or Tool axis and
  solves IK from the current config (stops if IK can't follow). `CartesianJog.tsx`
  (X/Y/Z/Rx/Ry/Rz +/- grid, shown for World/Tool frames), `KinematicsReadout.tsx`
  (manipulability % bar + "near singularity" flag). FrameSelector enables
  World/Tool (User still Phase 5); `Pendant` swaps Joint↔Cartesian grid by frame.
- **Phase 3 · Unit 4 — Motion engine.** `src/program/motion.ts` (pure, tested:
  `lerpAngles` [MOVJ], `interpolatePose` [MOVL: straight-line position + geodesic
  orientation], distance helpers). `src/program/useMotion.ts`: `runMove(plan)`
  rAF playback — MOVJ joint-lerp, MOVL IK at each interpolated pose; duration sized
  by distance × speed override; aborts on E-STOP/HOLD; typed `MoveOutcome`. First
  `src/program/` module (the offline programmer reuses it in Phase 4).
- **Phase 3 · Unit 5 — Go to pose.** `GoToPose.tsx`: X/Y/Z/Rx/Ry/Rz inputs (+ "Set
  current"), MOVJ/MOVL toggle, validates the target with IK before moving and
  surfaces the typed failure reason (out of reach / singular / joint limit), then
  runs the move via `useMotion`. Mounted in the pendant.
- **Phase 3 · Unit 6 — TCP trail.** `src/state/settingsStore.ts` (showTrail +
  clear-nonce). `src/scene/TcpTrail.tsx`: drei `<Line>` fed from throttled state
  (a vertex only when the TCP moves >2 mm, capped 800), plus a live blue TCP
  marker following each frame via a ref; computed from FK and mapped Z-up→Y-up
  (x,y,z)→(x,z,−y), anchored to the base triad (not the auto-seated GLB).
  `ViewportOverlay.tsx` (HTML over the canvas) toggles/clears the trail; "Clear"
  remounts the trail via a key in `Viewport`. Build + lint + 46 tests green; dev
  serves 200.

- **Phase 4 · Unit 1 — Instruction model.** `src/types.ts` adds `Waypoint`
  (named taught pose + the joint angles that reached it, FANUC `P[]`-style),
  the `MovJ | MovL | Wait | Call` discriminated `Instruction` union, and
  `Program` (versioned: `{version:1, id, name, waypoints, instructions}`).
  New `src/program/instructionModel.ts` (pure, no React/three/DOM):
  `createWaypoint`/`createProgram`/`createMovJ`/`createMovL`/`createWait`/
  `createCall` constructors, `addWaypoint`/`removeWaypoint` (cascades to drop
  instructions referencing the removed waypoint), `addInstruction`/
  `removeInstruction`/`moveInstruction` (reorder) — every function returns a
  new `Program`, no mutation. No UI yet (the editor lands next unit, per the
  scoping rule against combining pendant/program-engine work in one step).
  `npm run build` + `npm run lint` + `npm run test` (53 tests, +7) all pass;
  no browser-visible change (model only), same precedent as Phase 1 Unit 4
  and Phase 3 Unit 1.

- **Phase 4 · Unit 2 — Program editor + TEACH.** New `src/state/
  programStore.ts` (zustand wrapper around `instructionModel.ts`'s pure
  functions — the editor and TEACH call these actions, never the pure
  functions directly): `teachWaypoint` (captures live joint angles + their FK
  pose, auto-named P1, P2…), `addMoveJ`/`addMoveL`/`addWait`/
  `removeInstruction`/`removeWaypoint`/`moveInstruction`. `SafetyControls.tsx`:
  TEACH is now live (was disabled since Phase 2). New `src/program/
  ProgramEditor.tsx`: a right-side drawer (ui-context.md) listing the
  instruction sequence (line numbers, ↑/↓ reorder, × delete) and the taught
  waypoints (pose preview, +J/+L to append a move, × to delete — cascades to
  drop instructions referencing it), plus a WAIT seconds input. New moves pick
  up the pendant's current speed override. Run/Step/Pause/Stop/Loop and
  Save/Load/.tp are shown disabled (next units), matching the established
  pattern of shipping future controls visibly-disabled ahead of their unit.
  `settingsStore` gained `programEditorOpen`/`toggleProgramEditor`; the status
  strip's PROG indicator is now a live program-name button that opens the
  drawer. Verified end-to-end in a headless browser (Playwright, temp dev
  dependency, removed after): open drawer → TEACH twice → add MOVJ/MOVL →
  reorder → add/delete WAIT, zero console errors, dark-theme styling intact,
  no overlap with the viewport/pendant. `npm run build` + `npm run lint` +
  `npm run test` (53 tests) all pass.

- **Phase 4 · Unit 3 — Run/Step/Pause/Stop/Loop playback.** New
  `src/state/playbackStore.ts` (zustand: `running`, `currentIndex`, `loop`,
  `lastError`) tracks where playback is in the program, separate from the
  program's data and from `machineStore`'s safety state. New `src/program/
  useProgramPlayback.ts` sequences `program.instructions` over the Phase 3
  `useMotion` engine: MOVJ/MOVL look up their waypoint and call `runMove`
  (each line's recorded `speedPct` becomes the live pendant speed override
  for that move, mirroring a real pendant); WAIT runs a cancellable
  `setTimeout`; CALL has no resolvable target yet (no second program exists)
  so it logs a warning and advances rather than blocking the sequence.
  Pause/Stop are *not* a separate motion path — Pause calls the existing
  `machineStore.setHold(true)` (identical to pressing HOLD) and Stop cancels
  the in-flight move and rewinds to instruction 0, so E-STOP/HOLD interrupt
  playback exactly like a jog (architecture invariant unchanged). The
  recursive step driver is rebuilt in a `useEffect` and invoked through a ref
  (`executeAtRef`) rather than a self-referencing `useCallback`, to satisfy
  the repo's `react-hooks/immutability` rule (flags a callback recursing on
  itself, since the linter can't verify the recursive call sees dependency
  updates) while still mutating only inside an effect, never during render.
  `ProgramEditor.tsx`: Run/Step/Pause/Stop/Loop are now live (replacing the
  Unit 2 disabled placeholders); the active instruction is highlighted amber
  while running; editing controls (reorder/delete/add move/add wait) lock
  while a run is in flight to avoid mutating a program mid-playback; a
  `lastError` banner surfaces typed move failures (out of reach / singular /
  limit / aborted). Verified in a headless browser: Step executes exactly one
  line and halts; Run disables Run and re-enables on finish; Pause/Stop drive
  the same disable/enable transitions; zero console errors. (This specific
  headless Chromium renders with software GL — console shows GPU-stall
  warnings — so `requestAnimationFrame` fires irregularly, making "catch a
  move exactly mid-flight" an unreliable assertion in this environment
  specifically; the state-machine transitions themselves were confirmed
  reliably.) `npm run build` + `npm run lint` + `npm run test` (53 tests) all
  pass.

- **Phase 4 · Unit 4 — Save/Load/.tp export.** New `src/program/migrate.ts`:
  `migrateProgram(data: unknown): Program` validates a parsed JSON file's
  shape at the boundary (code-standards.md — a `.json` file is external input
  and may be hand-edited, corrupt, or from a future format) before trusting
  it; throws a typed `ProgramMigrationError` rather than returning a half-valid
  program. Only version 1 exists today, but future format changes add a case
  here instead of changing `Program` in place. New `src/program/serialize.ts`
  (pure): `serializeProgram`/`deserializeProgram` (JSON, round-tripped through
  `migrateProgram`) and `exportTp` — a FANUC-pendant-flavored `.tp` text
  listing (instructions + `P[]` waypoint poses), write-only documentation
  (code-standards.md: parsing TP text back in is out of scope). `programStore`
  gained `loadProgram` (replaces the active program wholesale). `ProgramEditor.tsx`:
  Save/Load/`.tp` buttons under the program name (matching the ui-context.md
  mock) — Save and `.tp` trigger a browser file download; Load opens a hidden
  file picker, parses + migrates the chosen file, and shows a typed error
  banner (e.g. "unsupported program version") instead of silently failing or
  crashing on a malformed file; Load is disabled while a run is in flight,
  consistent with the rest of the editor. Verified in a headless browser:
  Save produces a downloadable `.json` with the taught waypoint + instruction
  intact, `.tp` export contains the program name and the MOVJ line, loading
  that saved file back in reproduces the program, and loading a malformed
  file surfaces the typed error banner instead of corrupting state — zero
  console errors throughout. `npm run build` + `npm run lint` + `npm run test`
  (63 tests, +10) all pass.

**Phase 4 done-when met:** instruction model (MOVJ/MOVL/WAIT/CALL) + teach
point, editor (add/del/reorder), Run/Step/Pause/Stop/Loop, JSON save/load, and
`.tp` text export are all shipped and wired into the pendant + program editor
drawer. Known gaps carried forward: CALL has no resolvable target (no second
program / program registry exists yet — would need its own unit beyond the
original Phase 4 plan); the FK↔GLB visual mismatch and joint-jog-direction
sign-off remain open from earlier phases.

- **Phase 5 · Unit 1 — Cell store + Cell Browser tree.** `src/types.ts` adds
  `Transform3` (position mm / rotation deg / scale) and `CellObject`
  (`{id,name,kind:'part'|'fixture'|'obstacle',geometryRef,transform,color}`,
  per code-standards.md). New `src/cell/cellStore.ts` (zustand:
  `objects`/`selectedId` + `addObject`/`removeObject`/`selectObject`) — empty
  until CAD import (next unit) calls `addObject`; this unit ships the shape
  and selection slot only, per the scoping rule against combining CAD import
  with cell-browser UI in one step. New `src/ui/CellTreeNode.tsx`
  (`CellTreeSection` collapsible header, `CellTreeLeaf` colored-dot row) and
  `src/cell/CellBrowser.tsx`: the ui-context.md tree — Robot (static),
  Parts/Fixtures/Obstacles (filtered from `cellStore.objects`, each shows
  "none imported" while empty), Targets (the active program's taught
  waypoints, read from `programStore` — no separate target store, reuses
  Phase 4's `Waypoint[]`), and a "+ Import CAD" button shipped visibly
  disabled (tooltip "needs CAD import — next unit"), matching the established
  pattern (e.g. Phase 2's World/Tool frame tabs). Replaces the `App.tsx`
  left-rail placeholder. Verified in a headless browser (Playwright, temp dev
  dependency, removed after): all five tree sections render, sections
  collapse/expand, Import CAD is disabled, zero console errors. `npm run
  build` + `npm run lint` + `npm run test` (63 tests) all pass.

- **Phase 5 · Unit 2 — CAD import.** New `src/cad/`: `validate.ts`
  (`validateCadFile` — extension allow-list `stl|obj|gltf|glb`, 50 MB cap,
  explicit STEP/IGES rejection message); `loaders.ts` (`loadCadFile` —
  `STLLoader`/`OBJLoader`/`GLTFLoader` from `three/examples/jsm/loaders`,
  each result centered on its own local origin per code-standards.md, not
  positioned by the source file's modeled offset); `geometryCache.ts` (a
  plain `Map<id, BufferGeometry|Object3D>` — the loaded three.js object is
  deliberately *not* part of `CellObject`/`cellStore`, per the comment
  already on `CellObject` in types.ts, so the store stays plain/serializable;
  `disposeCadGeometry` frees GPU geometry/materials on removal);
  `importCadFile.ts`/`importCadFiles` (the single entry point for both the
  file picker and viewport drag-drop: validate → load → cache → push a
  `CellObject` to `cellStore`, defaulting every import to kind `part` — Unit
  3 adds a way to change it). `cellStore.removeObject` now also calls
  `disposeCadGeometry`; added an `importError` slot + `setImportError` so the
  file picker and the drag-drop path share one error banner. `CellBrowser.tsx`:
  "+ Import CAD" now opens a real file picker (was disabled); leaves gained a
  hover `×` delete (`CellTreeNode.tsx`'s `CellTreeLeaf` grew an optional
  `onDelete`). `App.tsx`'s viewport `<main>` gained `onDragOver`/`onDrop`
  calling the same `importCadFiles`. New `src/scene/CellObjects.tsx` renders
  every `cellStore` object at its transform (mm/deg → m/rad at this
  boundary, architecture.md invariant #3): STL geometry has no inherent
  material, so it's wrapped in a mesh colored by `object.color`; OBJ/GLTF
  bring their own materials and render via `<primitive>` unchanged. Mounted
  in `Viewport.tsx`. `scene/colors.ts` gained `objPart`/`objFixture`/
  `objObstacle`; `cell/cellColors.ts` is the shared part/fixture/obstacle
  color map (tree dots, import default, scene fallback material).
  **Bug caught during verification:** the file-input `onChange` read
  `e.target.files` (a *live* `FileList`) and then cleared `e.target.value`
  to allow re-selecting the same file — but clearing `value` empties that
  same live list, so the import silently saw zero files. Fixed by copying
  to a plain array (`Array.from`) before clearing, in both the file-picker
  handler and the drag-drop handler. Verified in a headless browser
  (Playwright, temp dev dependency, removed after): importing a real `.stl`
  adds a "Parts (1)" leaf showing the filename, selecting/deleting it removes
  it from the tree, and importing a `.xyz` file surfaces the typed
  "Unsupported file type" banner instead of failing silently — zero console
  errors throughout. `npm run build` + `npm run lint` + `npm run test`
  (63 tests) all pass.
  **Follow-up (caught while syncing docs after Unit 7):** code-standards.md
  already documented "drag-to-place uses raycasting against the floor plane,"
  but drops were landing at the cell origin regardless of where they were
  dropped. Added `src/scene/activeCamera.ts` (a live camera handle —
  `CameraRig`, Unit 7, keeps it current — since the native HTML drop handler
  in `App.tsx` lives outside the r3f `Canvas` and has no other way to reach
  the active camera) and `src/scene/dropToFloor.ts` (raycasts the drop's
  client coordinates onto the y=0 floor plane, returns mm). `importCadFile`/
  `importCadFiles` gained an optional `position` param threaded through from
  `App.tsx`'s drop handler. Verified with a synthetic `DragEvent` + `DataTransfer`
  carrying a real file: an off-center drop produced a non-origin floor position
  in the property panel, zero console errors.

- **Phase 5 · Unit 3 — Assign type + color.** New `src/cell/ObjectPropertyPanel.tsx`
  (the `ObjectPropertyPanel` named in ui-context.md's component library):
  shown in the Cell Browser rail when a `CellObject` is selected. Type is
  three `FrameTab`s (Part/Fixture/Obstacle, reusing the Phase 2 segmented-tab
  primitive) that move the object between the tree's sections; color is the
  three kind presets plus a native `<input type="color">` for a custom value.
  `cellStore` gained a generic `updateObject(id, patch)` (rather than a setter
  per field) since Unit 5 needs to patch `transform` too. `npm run build` +
  `lint` + `test` (63 tests) pass.

- **Phase 5 · Unit 4 — Transform gizmo.** `scene/CellObjects.tsx`: the
  selected object gets a drei `TransformControls` attached to its group ref.
  Translate by default; holding Shift switches to rotate (architecture.md's
  mock: "drag to move, shift-drag to rotate") — tracked via a plain
  `keydown`/`keyup` listener while selected, not a new store field, since it's
  transient interaction state no other component needs. `onObjectChange`
  reads the dragged group's position/rotation/scale and pushes them through
  `cellStore.updateObject` (mm/deg, converted at this boundary) rather than
  leaving the mesh as the source of truth (code-standards.md: "writes back to
  the cell store, not directly to the mesh"). `OrbitControls.makeDefault` in
  `Viewport` means drei auto-disables orbiting for the duration of a drag.
  **Lint catch:** the strict `react-hooks/refs` rule (first hit in Phase 3)
  flagged reading `groupRef.current` during render to decide whether to mount
  `TransformControls`; removed the check — the group always renders first, so
  by the time `selected` flips true the ref is already populated. `npm run
  build` + `lint` + `test` (63 tests) pass.

- **Phase 5 · Unit 5 — Object property panel (position/rotation/scale).**
  `ObjectPropertyPanel.tsx` extended with three `Vec3Row`s (Position mm,
  Rotation deg, Scale ×) — direct-entry numeric inputs that write through the
  same `updateObject` the Unit 4 gizmo uses, so dragging in the viewport and
  typing in the panel stay in sync (both are just writes to `cellStore`).
  `npm run build` + `lint` + `test` (63 tests) pass.

- **Phase 5 · Unit 6 — Tool + user frame registration.** `types.ts` adds
  `Frame` (`{id, name, offset: Pose}` — a frame *is* a pose relative to its
  parent: tool0 for tool frames, the world base for user frames). New
  `src/frames/framesModel.ts` (pure `createFrame`) and `src/state/
  framesStore.ts` (zustand: separate `toolFrames[]`/`userFrames[]` +
  `activeToolFrameId`/`activeUserFrameId`, each nullable — `null` means the
  un-offset identity, so no seed frame is needed; `activeToolOffset`/
  `activeUserOffset` selectors fall back to a zero `Pose`). New `src/frames/
  FramePanel.tsx`: a collapsible section in the pendant (direct-entry only —
  the 3-point capture method from project-overview.md is a documented gap,
  see below) listing each frame with a name, an active toggle, a 6-field
  mm/deg offset editor, and delete. `FrameSelector.tsx`'s User tab is now
  enabled (was disabled since Phase 2); `Pendant.tsx` treats `user` as a
  Cartesian frame like `world`/`tool` and mounts `FramePanel`.
  **The actual jog-axis math** (`pendant/useJog.ts`'s `applyCartesianStep`):
  World jog is unchanged (fixed base axes); User jog uses the active user
  frame's rotation matrix (`eulerXYZToRot3` on its `rx/ry/rz`) for translation
  axis directions, and conjugates the rotation step through that same matrix
  (`Ruser·Rd·Ruserᵀ`) so "User Rz" spins about the user frame's own Z, not the
  base's; Tool jog does the symmetric thing on the wrist side (`Rc·Rtool` for
  translation axes, `Rc·(Rtool·Rd·Rtoolᵀ)` for rotation). **Scoping decision:**
  only the frame's *orientation* offset is applied to jog axes — the
  *translation* offset (where the tool/user origin actually sits, e.g. a
  gripper's length) is not, since correctly shifting the IK target by that
  offset would mean solving for a controlled point other than the flange,
  a bigger change than this unit's "registration + frame selector" scope.
  Recorded as an open question below. `npm run build` + `lint` + `test`
  (63 tests) pass.

- **Phase 5 · Unit 7 — Multiple camera views.** New `src/scene/sceneFrame.ts`:
  extracted the FK→scene (`(x,y,z)_fk → (x,z,−y)_scene`, mm→m) mapping out of
  `TcpTrail.tsx` so `CameraRig` could reuse it without duplicating the
  convention. New `src/scene/CameraRig.tsx` replaces the bare `OrbitControls`
  in `Viewport.tsx`: Orbit/Front/Side/Top are one-shot snaps (set
  `camera.position` + `controls.target`, then the user can still orbit
  freely — Roboguide's preset views work the same way); TCP-follow
  continuously re-centers `controls.target` on the live TCP each frame (via
  `useFrame`, reading the robot store directly rather than subscribing, same
  pattern as `TcpTrail`), so you orbit *around* the tool point instead of the
  origin. `settingsStore` gained `cameraView` + a `cameraSnapNonce` bump
  counter (so re-clicking the same preset re-snaps even though the value
  didn't change) + `setCameraView`. `ViewportOverlay.tsx` gained the
  Orbit/Front/Side/Top/TCP button row next to the trail controls. `npm run
  build` + `lint` + `test` (63 tests) pass.

**Phase 5 done-when met:** importing an STL/OBJ/GLTF mesh, positioning it with
the gizmo, and defining a tool frame all work end-to-end (project-overview.md's
phase done-when). Verified together in a headless browser: import → select →
reassign type (moves tree sections) → drag-edit position via the gizmo →
confirm the property panel's numbers update → register a tool frame → switch
the pendant to the User frame → snap through all five camera presets — zero
console errors throughout. Known gaps carried forward (see Open Questions):
the 3-point tool/user frame capture method is unimplemented (direct-entry
only); tool/user frame *translation* offsets don't shift the Cartesian jog's
IK target, only axis orientation does. Phase 6 (study + visualization tools)
is next when the user says so.

## What exists after Phase 3 (handoff snapshot)

- **Kinematics** (`src/kinematics/`, pure): `forward` (FK), `dh`, `units`,
  `linalg`, `rotation`, `jacobian` (`computeJacobian`/`manipulability`),
  `inverse` (`inverseKinematics`/`inverseKinematicsFromMatrix`). Tests: forward,
  linalg, jacobian, inverse.
- **Program** (`src/program/`): `motion.ts` (pure interp, tested) + `useMotion.ts`
  (move playback hook). This is the seed of the Phase 4 offline programmer.
- **Pendant** (`src/pendant/`): adds `CartesianJog`, `KinematicsReadout`,
  `GoToPose`; `useJog` now does joint + Cartesian (World/Tool); `Pendant`
  switches grids by active frame.
- **Scene** (`src/scene/`): adds `TcpTrail` + `ViewportOverlay`; `Viewport` keys
  the trail off the clear-nonce. Colors gained `trail`/`tcpMarker`.
- **State** (`src/state/`): adds `settingsStore` (view toggles).
- **Carried-forward limitations:** User frame disabled until Phase 5; incremental
  Cartesian jog + program editor are Phase 4; the trail/TCP marker render in
  FK/base coordinates and won't sit on the 4-DOF GLB tip until re-rig; connection
  pill still Offline (Phase 7).

## What exists after Phase 2 (handoff snapshot)

- **Stores** (`src/state/`): `robotStore` (angles), `pendantStore` (frame/mode/
  step/speed), `machineStore` (estop/hold/moving + `deriveStatus`).
- **UI primitives** (`src/ui/`): `PendantButton`, `FrameTab`, `SpeedSlider`,
  `JogButton`, `JointBar`, `StatusPill`. (`ConnectionPill` deferred to Phase 7;
  `StatusPill` covers the offline pill for now.)
- **Pendant** (`src/pendant/`): `Pendant` (composition), `FrameSelector`,
  `JogModeSelector`, `JointJog` (+/- grid), `SpeedOverride`, `PoseReadout`,
  `SafetyControls`, `StatusStrip`; `useJog` hook + pure `jogMath` (+ tests).
- **Known limitations carried forward:** World/Tool/User jog disabled until IK
  (Phase 3); J4/J6 drive store/FK but not the 4-DOF mesh; TEACH disabled until
  the programmer (Phase 4); connection pill static Offline until Phase 7.

## Decisions this session

- **GLB rig:** keep the supplied model; remap `JOINT_NODES`/`JOINT_AXES` to its
  real `Null` pivot nodes in Unit 6 (validate axes empirically). User will
  re-rig to `Link1..Link6` in Blender later. Until then the arm renders but does
  not articulate.
- **DH convention:** architecture.md said "Modified DH", but the locked DH table
  only forms a valid (non-degenerate) waist/shoulder/elbow arm under STANDARD
  (distal) DH — under modified DH, J1∥J2 (degenerate). User approved using
  standard DH and correcting the label. DH **values/limits unchanged**;
  `architecture.md` + `dh-params.ts` wording updated.
- **Phase 2 — store split:** jog *settings* (frame/mode/step/speed) live in
  `pendantStore`; *safety/motion* (estop/hold/moving) in `machineStore`; *pose*
  stays in `robotStore`. Keeps each store single-concern and lets `useJog` and
  the status strip subscribe narrowly. `machineStore` was created in Unit 1 (its
  guard is needed by the Unit-2 jog loop) though its UI ships in Unit 4.
- **Phase 2 — E-STOP latch UX:** engage on one press, clear only via a separate
  explicit Reset (two-step, like a real machine) — no accidental single-click
  reset. The jog loop polls `machineStore` each frame so E-STOP/HOLD halt an
  in-flight jog regardless of which component triggered them.
- **Phase 2 — ConnectionPill deferred:** the component library lists it, but real
  connection state arrives in Phase 7; the status strip uses `StatusPill` with an
  `offline` tone until then rather than shipping an empty wrapper.
- **Phase 3 — IK method:** Levenberg DLS `(JJᵀ+λ²I)y=e, Δθ=Jᵀy` with a backtracking
  line search and per-step limit clamping. Chosen over plain pseudo-inverse for
  singularity robustness, and over fixed-λ DLS for tight convergence — the line
  search guarantees a monotonic error decrease so seeded targets (jog / go-to-pose
  from the current config) converge to ~0.01 mm. Geometric Jacobian (not numeric)
  for the educational value; validated against finite-difference FK in tests.
- **Phase 3 — failure classification:** after non-convergence, blame `singular`
  (manipulability < 2 % of reference), else `limit` (last step clamped), else
  `unreachable`. Heuristic but typed and never silent (invariant #5).
- **Phase 3 — Cartesian jog via repeated IK:** each frame offsets the current TCP
  transform and re-solves IK from the current config (closed-loop), rather than
  integrating Jacobian velocities (open-loop drift). Reuses `inverseKinematics`,
  no separate velocity controller.
- **Phase 3 — motion engine in `src/program/`:** MOVJ/MOVL interpolation +
  `useMotion` live here (not `src/pendant/`) because they are the playback
  primitives the Phase 4 programmer sequences; the pendant's GoToPose is just one
  caller. Keeps "pendant UI" and "program engine" in separate modules
  (ai-workflow-rules.md scoping).
- **Phase 3 — TCP trail in FK coordinates:** the trail/marker are computed from FK
  and mapped Z-up→Y-up onto the base triad, not attached to the GLB (a 4-DOF
  stand-in whose tip doesn't match FK). The path *shape* (straight MOVL vs curved
  MOVJ) is the point; absolute placement waits on a GLB re-rig.
- **Phase 3 — strict react-hooks lint:** the new `react-hooks/immutability` +
  `refs` + `set-state-in-effect` rules disallow mutating useMemo/ref values during
  render and setState-in-effect. The trail therefore uses drei `<Line>` from
  throttled state (vertex only on real TCP motion) and clears via a remount key,
  instead of an imperatively-mutated BufferGeometry.

## In Progress

- Phase 5 complete (Cell Browser, CAD import, type/color assignment,
  transform gizmo, object property panel, tool/user frames, camera views).
  Ready to start Phase 6 (study + visualization tools) when the user says so.
  Open: user sign-off on joint jog directions (flip any `sign` in
  `glb-joint-map.ts`); the FK↔GLB visual mismatch (trail/TCP marker are in
  FK/base coords) — a re-rig of the GLB to Link1..Link6 would let FK geometry
  sit on the mesh; CALL has no resolvable target (no second program /
  program registry exists yet); tool/user frame 3-point capture is
  unimplemented (direct-entry only); frame *translation* offsets don't shift
  the Cartesian jog's IK target, only axis orientation does (see Phase 5
  Unit 6 above and Open Questions below).

- **Measure tool (for the GLB↔DH comparison).** A two-point scene ruler so the
  GLB's real link lengths can be measured and compared against the locked DH
  table. New `src/state/measureStore.ts` (active flag + up to two scene-space
  points, third click restarts; `hoverFace` for live face highlighting),
  `src/scene/MeasureTool.tsx`. `RobotArm.tsx`'s `<primitive>` gained an
  `onClick` (gated on `measureStore.active`) that records the raycast hit's
  world point — onClick not onPointerDown so orbiting doesn't drop stray
  points. `ViewportOverlay.tsx` adds a Measure toggle + a readout. Iterated
  through three revisions in this session:
  1. Straight-line distance + ΔX/ΔY/ΔZ via new `fkFromScene` (inverse of
     `sceneFromFk`, tested round-trip) — the **FK/DH frame**, not scene
     coords, so a/d comparisons line up directly.
  2. Added an axis-lock (Free/X/Y/Z), then **replaced it** with always-on
     SolidWorks-style decomposition: `buildStaircase` in `MeasureTool.tsx`
     draws the segment as 3 axis-aligned legs (one per DH axis) colored to
     match the existing base-triad convention (new `FK_AXIS_TO_SCENE` in
     `sceneFrame.ts`, tested), plus a dashed direct-distance line — all
     simultaneously, no toggle needed.
  3. Hover now highlights the *exact triangle* under the cursor (extracts
     `e.face`'s 3 vertices from the geometry, world-transforms them, draws a
     small overlay), not the whole mesh object — the GLB's links are single
     meshes with hundreds of faces, so an earlier per-object-material-clone
     version lit up an entire link instead of one face.
  `npm run build` + `lint` + `test` (61 tests) pass.

- **Phase 6 · Unit 1 — DH frame gizmos.** New `src/scene/DhFrameGizmos.tsx`:
  one small `AxisTriad` per joint, positioned/oriented live from
  `jointTransforms(angles)` (unchanged, pure scene-layer unit per
  ai-workflow-rules.md). Mapping a whole frame into the Y-up scene is the
  fixed −90°-about-X remap left-multiplied onto the frame's 4×4 transform
  (`scene_T = FK_TO_SCENE · fk_T`); gl-matrix's `mat4` and `THREE.Matrix4`
  share the same column-major layout so it loads via `fromArray` directly.
  `settingsStore` gained `showDhFrames`/`toggleDhFrames`; new **DH Frames**
  button in `ViewportOverlay.tsx`. Mounted unconditionally in `Viewport.tsx`
  (matches `TcpTrail`'s always-mounted pattern). User confirmed the math is
  correct (verified independently: at home pose all 6 frames cluster within
  0.25 m of the base, exactly where expected) — but flagged the gizmos
  visibly diverging from the GLB mesh once joints move away from home.

  **Finding: DH_PARAMS does not match the real GLB's geometry — quantified.**
  This isn't the already-known "FK trail/marker render in base coords, not
  attached to the auto-seated mesh" cosmetic offset; it's that the GLB mesh
  (driven by `glb-joint-map.ts` spinning named rig nodes by angle, with no
  awareness of link lengths) and the FK skeleton (driven by `DH_PARAMS`' a/d
  values) are two geometrically *different* arms that only happen to look
  aligned at the home pose they were eyeballed against — they diverge
  increasingly as joints move, compounding down the chain. Extracted the
  rig's pivot empties' rest-pose world positions directly from the GLB via
  headless Blender (`Null→Null_2→Null_3→Null_4→Null_1→Null_6→Sphere`) and
  computed real pivot-to-pivot distances vs. each DH link's `√(a²+d²)`:

  | Segment | DH locked | Real GLB |
  |---|---|---|
  | J1→J2 | 200.0 mm | 119.1 mm |
  | J2→J3 | 50.0 mm | 65.8 mm |
  | J3→J4 | 200.0 mm | 160.3 mm |
  | J4→J5 | 0.0 mm | 52.7 mm |
  | J5/J6→tip | 60.0 mm | 225.9 mm |
  | **Total reach** | **710.0 mm** | **623.7 mm** |

  These are straight-line pivot distances, not yet properly decomposed into
  rigorous DH `a`/`d` (that needs each joint's true 3D rotation-axis
  direction folded in, not just point positions — flagged as a caveat, not
  done yet to avoid presenting under-verified numbers as authoritative).
  **Decision:** user chose to pause Phase 6 here and reconcile `DH_PARAMS`
  against this real geometry before building Units 2–5, which all read the
  same table. `npm run build` + `lint` + `test` (61 tests) pass; Unit 1
  itself is confirmed correct and stays in the tree.

- **Pendant jog UX: drag-bar + exact-entry, no held jog.** Replaced the +/-
  jog buttons on both the joint grid and the World/Tool/User Cartesian grid
  with a single combined control per row: `JointBar` (`src/ui/JointBar.tsx`)
  is now a drag target (press/drag anywhere along it sets the value
  proportionally to pointer position, with a round thumb at the current
  value) alongside `EditableAngle`'s click-to-type-exact-value. Both commit
  *instantly* (direct `setAngle`/`setAngles`, or an IK solve for Cartesian)
  rather than animating a held jog. This made the Mode section
  (continuous/incremental + step size) meaningless — incremental specifically
  only made sense paired with a press-and-release button — so it's gone, and
  so is everything that only existed to serve it: `JogModeSelector.tsx`,
  `useJog.ts` (the whole continuous-jog rAF runner, including its frame-aware
  Cartesian step math for World/Tool/User), `ui/JogButton.tsx`,
  `jogMath.ts`'s `jogStep`/`jogRateDegPerSec`, and `pendantStore`'s
  `jogMode`/`stepSize`/`STEP_SIZES`. `pendantStore.speedPct` stayed — it's
  still read by `useMotion.ts` for recorded MOVJ/MOVL playback speed, unrelated
  to jogging now. **Known regression carried forward:** the deleted
  `useJog.ts` was the only place Tool/User Cartesian jogging was actually
  frame-aware (jogging "along the tool's own Z", conjugating through the
  registered frame's rotation) — `CartesianJog.tsx`'s new drag/edit rows
  solve IK against the world-frame TCP pose regardless of which frame tab is
  active, so Tool/User no longer change *what dragging a row does*, only the
  label. Revisit if true per-frame jogging is wanted back (re-derive from
  `applyCartesianStep` in git history rather than `useJog.ts`, which no
  longer exists). `npm run build` + `lint` + `test` (58 tests, -5 from the
  removed jogMath functions) pass.

- **Phase 6 · Unit 1 — DH frame gizmos.** New `src/scene/DhFrameGizmos.tsx`:
  one small `AxisTriad` (size 0.08 m, vs. the base triad's 0.3 m) per joint,
  positioned/oriented live from `jointTransforms(angles)`'s six cumulative
  DH frames (`kinematics/forward.ts`, unchanged — pure scene-layer unit per
  ai-workflow-rules.md's "don't combine scene + kinematics changes"). Mapping
  a whole frame (not just a point, like `TcpTrail`/`CameraRig` already do)
  into the Y-up scene is the same fixed −90°-about-X remap left-multiplied
  onto the frame's 4×4 transform: `scene_T = FK_TO_SCENE · fk_T` — rotates
  the frame's basis vectors the same way `sceneFromFk` rotates a position.
  gl-matrix's `mat4` and `THREE.Matrix4` share the same column-major memory
  layout, so the DH `mat4` loads directly via `THREE.Matrix4.fromArray`, no
  manual decomposition. `settingsStore` gained `showDhFrames`/
  `toggleDhFrames` (doc comment there already anticipated this). Mounted
  unconditionally in `Viewport.tsx` (matches `TcpTrail`'s always-mounted,
  internally-gated pattern, so toggling doesn't remount); each triad's own
  `visible` prop follows the toggle, and the `useFrame` early-returns when
  off. New **DH Frames** button in `ViewportOverlay.tsx` (Axis3D icon,
  amber active state, same pattern as Trail/Measure). `npm run build` +
  `lint` + `test` (61 tests) pass; dev server serves 200, `DhFrameGizmos.tsx`
  transforms cleanly. **Awaiting user visual confirm** (toggle DH Frames,
  jog a joint, confirm all six small triads track the arm's actual link
  frames without drift/flicker) before Unit 2 (work envelope).

- **Resolved: GLB had no node names.** The `public/models/robot-arm.glb` in
  use partway through this session had 0/23 named nodes (a re-export had
  dropped them), so `GLB_JOINT_MAP`'s `Null_3`/`Null_4`/`Null_1`/`Null_6`
  lookups all failed silently (console warning, joint inert) — and a
  separate copy had the gripper mesh parented as a sibling of the body
  instead of nested under a joint, so rotating it visually detached the
  piece rather than carrying it along (Three.js only cascades a rotation to
  actual scene-graph children). Built a temporary dev-only "GLB Rig Mapping"
  panel + a click-to-pick tool (raycast in the viewport → walk up to the
  nearest named ancestor) to diagnose and patch mappings live without
  reloading, while tracking down a correctly-named/correctly-nested copy of
  the source model (`Null→Null_2→Null_3→Null_4→Null_1→Null_6`, matching the
  original Unit 6 investigation). Once the correct `.glb` was back in place,
  the override tooling was removed again (`src/pendant/GlbRigPanel.tsx`,
  `src/state/glbJointMapStore.ts`, the `glb-joint-map.ts` override builder,
  and the click-to-pick wiring in `RobotArm.tsx`/`CameraRig.tsx`/
  `JointJog.tsx`) — `glb-joint-map.ts` and `RobotArm.tsx` are back to their
  original Unit 6 form. **Takeaway carried forward:** the correct rigged
  `.glb` must ship in `public/models/` before relying on `GLB_JOINT_MAP`'s
  node names; there's no in-app recovery if the file's names/hierarchy
  drift again short of re-adding this same tooling. `npm run build` + `lint`
  + `test` (63 tests) pass.

---

## Phase Plan

### Phase 1 — GLB arm + scene + FK
1. Scaffold: Vite + React + TS + Tailwind + r3f, tokens from `ui-context.md`.
2. Scene shell: floor grid, lighting, orbit camera, base frame helper.
3. GLB model: download from Sketchfab, gltfjsx → `src/scene/RobotArm.tsx`.
4. DH config: `src/config/dh-params.ts` (DH table, limits, node map).
5. FK module: `src/kinematics/forward.ts` (pure).
6. Joint refs: drive each GLB node rotation from joint angles in `useFrame`.
7. Jog sliders: J1–J6 update the joint-angle store live.
8. TCP readout + Vitest FK known-value tests.

### Phase 2 — Teach pendant
Overall: iPendant-style panel — joint jog +/-, frame selector, jog mode + step
size, speed override, HOLD, E-STOP, HOME, status strip. Units:
1. Pendant state store (`src/state/pendantStore.ts`: jogMode cont/incr, stepSize,
   speedPct, activeFrame) + shared UI primitives in `src/ui/` (PendantButton,
   FrameTab, SpeedSlider).
2. Joint jog +/- buttons: hold-to-jog (continuous, speed-scaled) + incremental
   (one step), driven by the pendant store; clamp to JOINT_LIMITS. Replaces the
   raw Unit-7 sliders (keep limit bars).
3. Frame selector (Joint active; World/Tool/User shown but disabled until Phase 3)
   + speed override wired to jog rate.
4. Safety controls: HOLD (pause jog/playback), E-STOP (prominent red; halts motion,
   latches until reset), HOME. Motion/estop state in a store.
5. Status strip wired live: active frame, speed %, program name (placeholder),
   robot status pill, connection pill (Offline until Phase 7), E-STOP indicator.

**Done when:** every joint jogs via +/- in both modes, speed/step affect jog,
E-STOP/HOLD/HOME behave, status strip is live, build + tests pass.

### Phase 3 — IK + Cartesian + linear moves
- Damped-least-squares IK, world/tool Cartesian jog, "go to pose", MOVJ vs MOVL, TCP trail, singularity warning, joint-limit bars, IK round-trip tests.

### Phase 4 — Offline programmer
- Instruction model (MOVJ/MOVL/WAIT/CALL), Teach point, editor (add/del/reorder), Run/Step/Pause/Stop, loop, JSON save/load, `.tp` text export.

### Phase 5 — 3D cell + CAD import
1. Cell store + Cell Browser tree (robot / parts / fixtures / obstacles / targets).
2. CAD import: `src/cad/` STL/OBJ/GLTF loaders, drag-drop + file picker, validation (extension, size cap).
3. Assign imported object a type (part/fixture/obstacle) and color.
4. Transform gizmo (drei TransformControls): drag to move, shift-drag to rotate.
5. Object property panel: position / rotation / scale / type.
6. Tool frame + user frame registration; frame selector on pendant.
7. Multiple camera views (orbit/front/side/top/TCP-follow).

**Done when:** user imports an STL/OBJ/GLTF mesh, positions it with the gizmo, and defines a tool frame.

### Phase 6 — Study + visualization tools
- DH frame gizmos toggle, work envelope, live DH editor, reach test, manipulability/singularity map.

### Phase 7 — Online mode + hardware bridge
1. `src/robot/protocol.ts`: shared JSON wire protocol + encode/decode + Vitest tests.
2. `SimDriver` extended with `sendProgram` / `onState` to match the interface.
3. `WebSerialDriver`: connect to Teensy over USB, stream jog at ~20 Hz, read state back.
4. `WebSocketDriver`: connect to ESP32/Pi bridge over Ethernet/WiFi, same protocol.
5. Connection panel: driver selector (Sim / Ethernet / USB), connect/disconnect, status.
6. Live jog: pendant drives the connected device; live monitor streams state into the 3D view.
7. Program download: serialize program, send over the active link.
8. Firmware protocol doc: define what the Teensy/ESP32 must implement.

**Done when:** selecting an online driver and connecting lets the pendant drive a connected device with state streamed back, and a program downloads over the link.

---

## Open Questions

- GLB model source: which Sketchfab model. Recommend a UR5-style 6R arm. Confirm before Phase 1 unit 3.
- GLB node names must match `JOINT_NODES`; inspect after download, rename in Blender if needed.
- **DH↔GLB reconciliation (blocking Phase 6 Units 2–5).** DH values were locked
  to approximate dimensions; now quantified as genuinely wrong vs. the real
  GLB (see Phase 6 Unit 1 write-up above for the per-segment table). Next
  step: derive proper DH `a`/`alpha`/`d` (not just pivot-to-pivot straight-line
  distance) by folding in each joint's true 3D rotation-axis direction from
  the rig, update `DH_PARAMS` + `architecture.md`'s locked table together,
  then re-verify the DH frame gizmos track the mesh correctly away from home.
- Online transport: both specced. Decide the actual hardware (Teensy-USB vs ESP32/Pi-Ethernet) before Phase 7 unit 3. USB is simpler/lower-latency; Ethernet/WiFi gives wireless and the Roboguide feel.
- Tool/user frame 3-point capture method (project-overview.md) is unimplemented — Phase 5 Unit 6 shipped direct-entry only. Add as its own unit if the 3-point workflow (jog to touch a point, repeat for origin/X/Y) is wanted.
- Tool/user frame *translation* offsets don't move the Cartesian jog's IK target (only axis orientation is applied — see Phase 5 Unit 6's scoping decision). Revisit if a registered tool frame needs to actually be the controlled point (e.g. jogging the tip of a gripper, not the flange).

---

## Architecture Decisions

| Decision | Reason |
|---|---|
| GLB from Sketchfab, not primitives | Real geometry immediately; primitives are fallback only. |
| `JOINT_NODES` + `JOINT_AXES` in config | Model node names/axes are data; swapping the model changes only config. |
| CAD import = mesh only (STL/OBJ/GLTF) | three.js loads these natively. STEP/IGES need a WASM kernel — deferred. |
| Both online transports behind one driver + shared protocol | Decide USB vs Ethernet later with zero app rewrite; both emit identical JSON. |
| `RobotDriver` with `sendProgram` + `onState` | Covers Roboguide's monitor + download workflow under one interface. |
| Kinematics as pure module | FK∘IK round-trip is the only reliable 6-axis IK test; reusable on firmware side. |
| Client-only, no backend | Single-user learning tool; programs and cells as JSON. |
| Roboguide as UX reference (not a copy) | Engineers know the workflow; we mimic function, not FANUC's software/assets/protocol. |

---

## Session Notes

- Target: Roboguide-equivalent offline programming + simulation + online control for a DIY 6-axis arm.
- Hardware: NEMA 17 + TMC2209 + Teensy 4.1 (~$90 bench kit). For Ethernet/WiFi online mode, add an ESP32 or Raspberry Pi as a network bridge that forwards the wire protocol to the Teensy.
- Build order: GLB arm → pendant → IK → offline programmer → cell + CAD import → study tools → online mode.
- IP boundary: independent build. Mimic Roboguide workflow/function only. Our own JSON wire protocol; no FANUC software, assets, or protocol.
- Expect IK numerical-stability work in Phase 3 and firmware protocol work in Phase 7.
