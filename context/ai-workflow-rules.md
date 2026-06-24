# AI Workflow Rules

## Approach

Build ArmStudio incrementally, spec-driven. Context files define what to build,
how, and the current state. Do not infer robot or Roboguide behavior from
scratch. Build one phase at a time; within a phase, one unit at a time; verify
each unit in the browser before the next. Phases/units are in `progress-tracker.md`.

---

## Scoping Rules

- One unit at a time. Confirm it runs before continuing.
- Do not combine scene changes with kinematics changes in one step.
- Do not combine pendant UI with the program engine in one step.
- Do not combine the driver layer with any UI component in one step.
- Do not combine CAD import with cell-browser UI in one step.

Split if a step cannot be verified by running `npm run dev` and seeing the
correct result in under 2 minutes.

---

## GLB Model Rule

The GLB is supplied by the user (Sketchfab download). Before Phase 1 unit 3, ask the user to:
1. Place a 6R arm GLB at `public/models/robot-arm.glb`.
2. Run `npx gltfjsx public/models/robot-arm.glb --types` and share the output.
3. Confirm node names match `JOINT_NODES`, or list the real names so config can be updated.

If the GLB is missing, build with the primitive fallback and flag the GLB step as blocked.

## CAD Import Rule

- Support only `.stl`, `.obj`, `.gltf`, `.glb`. Reject STEP/IGES and anything else with a clear message.
- Never execute file contents. Validate extension + size before loading.
- Imported meshes are test assets supplied by the user; do not generate or fabricate mesh files.

## Online / Hardware Rule

- `protocol.ts` is the single source of the wire format. Both online drivers use it. No driver invents messages.
- Do not test hardware drivers against a real device unless the user confirms one is connected. Until then, verify against a mock that speaks the wire protocol.
- Web Serial requires a Chromium browser over localhost/https. WebSocket needs a running bridge. Note these in the connection UI, do not assume they exist.

---

## Handling Missing Requirements

- Do not invent Roboguide-style behavior not in the context files.
- Resolve ambiguity in the relevant context file before implementing.
- DH changes: edit `architecture.md`, record in `progress-tracker.md`, then implement.
- Missing requirements → Open Questions in `progress-tracker.md`.

---

## Protected Files

Do not modify without explicit instruction:

- `src/config/dh-params.ts` — DH params and limits are locked.
- The `RobotDriver` interface in `src/robot/` — the hardware contract.
- `src/robot/protocol.ts` message shapes — the device contract. Changing them breaks firmware compatibility.
- Public signatures in `src/kinematics/` — tests and drivers depend on them.
- `public/models/robot-arm.glb` and any user-imported mesh — binary assets, never generated or modified.

---

## Keeping Docs in Sync

| What changed                          | Update                        |
|---------------------------------------|-------------------------------|
| Boundaries, drivers, storage, protocol| `architecture.md`             |
| GLB node names / joint axes           | `architecture.md` + tracker   |
| DH parameters or limits               | `architecture.md` + tracker   |
| Wire protocol message shapes          | `architecture.md` + tracker   |
| Colors, layout, components            | `ui-context.md`               |
| Domain types or conventions           | `code-standards.md`           |
| Feature scope or success criteria     | `project-overview.md`         |
| Phase completion / open questions     | `progress-tracker.md`         |

---

## Before Moving to the Next Unit

1. The unit works end to end in the browser within scope.
2. No `architecture.md` invariant was violated.
3. `progress-tracker.md` updated; the unit moved to Completed.
4. `npm run build` passes.
5. `npm run lint` passes.
6. `npm run test` passes (kinematics + protocol once they exist).
