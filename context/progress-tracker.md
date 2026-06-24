# Progress Tracker

Update this file after every meaningful implementation change.

---

## Current Phase

Phase 4 — Offline programmer: **In progress (Unit 1 done).**

Phase 3 — IK + Cartesian + linear moves: **COMPLETE (Units 1–6).**

Phase 2 — Teach pendant: **COMPLETE (Units 1–5).**

Phase 1 — GLB arm, 3D scene, and forward kinematics: **COMPLETE (Units 1–8).**
(Joint jog directions / the 4-DOF model limitation pending final user eyeball,
but functionally done — build + tests green.)

## Current Goal

Phase 3 done. The kinematics engine is complete: damped-least-squares IK, a
geometric Jacobian + manipulability, World/Tool Cartesian jog through IK, MOVJ vs
MOVL motion primitives with "go to pose", a TCP motion trail, and a live
singularity warning.

**Done-when (all met):** IK round-trips `fk(ik(pose)) ≈ pose` and returns a typed
reason on failure; World/Tool jog moves the TCP along the chosen frame axes; MOVL
traces a straight line and MOVJ a joint-interpolated path; the trail renders both;
the singularity warning fires near the wrist-aligned config; `npm run build`,
`npm run lint`, and `npm run test` (46 tests) all pass.

Earlier phases: Phase 2 shipped the FANUC iPendant-style pendant (frame selector,
jog mode + step, joint +/- jog, speed override, HOLD, latched E-STOP, HOME, live
status strip). Phase 1 shipped the GLB arm + scene + forward kinematics.

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

- Phase 4 · Unit 1 (instruction model) shipped. Ready to start Phase 4 · Unit 2
  (program editor UI: add/del/reorder over `instructionModel.ts`, plus a way to
  teach a `Waypoint` from the current robot/TCP pose) when the user says so.
  Open: user sign-off on joint jog directions (flip any `sign` in
  `glb-joint-map.ts`); and the FK↔GLB visual mismatch (trail/TCP marker are in
  FK/base coords) — a re-rig of the GLB to Link1..Link6 would let FK geometry
  sit on the mesh.

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
- DH values locked to approximate dimensions; update once physical link lengths are measured.
- Online transport: both specced. Decide the actual hardware (Teensy-USB vs ESP32/Pi-Ethernet) before Phase 7 unit 3. USB is simpler/lower-latency; Ethernet/WiFi gives wireless and the Roboguide feel.

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
