# Code Standards

## General

- Keep kinematics math pure and fully separated from React and three.js.
- One concern per module. Do not mix scene, UI, kinematics, program, and driver logic in one file.
- Fix root causes; no workarounds layered on broken behavior.
- Comment the robotics math (DH chain, Jacobian, IK loop) — this is a learning tool.

---

## TypeScript

- Strict mode throughout. Avoid `any`.
- Core domain types:
  - `JointAngles` — `[number,number,number,number,number,number]` (degrees)
  - `Pose` — `{ x:number; y:number; z:number; rx:number; ry:number; rz:number }` (mm + deg)
  - `IKResult` — `{ ok:true; angles:JointAngles } | { ok:false; reason:'unreachable'|'singular'|'limit' }`
  - `DHParam`, `JointLimit`
  - `Instruction` — `MovJ | MovL | Wait | Call` (discriminated union)
  - `Waypoint`, `Program` (with a `version` field)
  - `CellObject` — `{ id; name; kind:'part'|'fixture'|'obstacle'; geometryRef; transform; color }`
  - `Transform3` — `{ position:{x,y,z}; rotation:{x,y,z}; scale:{x,y,z} }` (mm + deg + unitless)
  - `Frame` — `{ id; name; offset:Pose }` (tool/user frame, direct-entry only)
  - `RobotState` — `{ angles:JointAngles; moving:boolean; fault:string|null }`
  - Protocol messages — discriminated union of `cmd` types and the `state` message
- Validate all external input at boundaries: program JSON, imported mesh files, bytes/frames from WebSocket and Web Serial.

---

## React / react-three-fiber

- Drive the scene from zustand. Do not hold robot pose in local component state.
- One `useFrame` loop drives the arm. No scattered timers.
- GLB joint rotation comes from `JOINT_AXES` config, never hardcoded per component.
- Pendant components are presentational: read state, call the active driver. No kinematics inside them.
- Shared hooks: `useJog()`, `useProgramPlayback()`, `useReachTest()`, `useConnection()`.
- Wrap the GLB and imported-mesh loaders in Suspense with a fallback. A missing/failed file must surface an error, never crash silently.

---

## Kinematics Module (`src/kinematics/`)

- Pure functions only. Radians/meters internally; convert at the boundary.
- Public API: `forwardKinematics`, `inverseKinematics`, `computeJacobian`, `manipulability`.
- Vitest: FK known poses (home, full-stretch, 90° per joint); IK round-trip `fk(ik(pose)) ≈ pose` across the workspace; IK failure returns `{ ok:false }`.

---

## CAD Import (`src/cad/`)

- Supported formats only: `.stl`, `.obj`, `.gltf`, `.glb`. Reject everything else with a clear UI message.
- Validate before loading: extension allow-list and a size cap (e.g. 50 MB). Reject STEP/IGES explicitly.
- Loaders produce `THREE.BufferGeometry` / `Group`; wrap as a `CellObject` and push to the cell store. Center the geometry on import.
- Dispose geometry and materials when an object is removed (avoid GPU memory leaks).
- Never `eval`, never run scripts embedded in a file. Geometry only.

---

## Cell and Scene (`src/cell/`, `src/scene/`)

- Cell objects live as data in the cell store; the scene renders from the store.
- Object position comes from the store, never hardcoded in a scene component.
- Transform gizmo (drei `TransformControls`) writes back to the cell store, not directly to the mesh.
- Drag-to-place uses raycasting against the floor plane; the result updates the store.

---

## Program and Instruction Model (`src/program/`)

- Instructions are a discriminated union; extend the union to add types, do not add flags to a generic object.
- Program JSON is versioned; migrations live in `src/program/migrate.ts`.
- `.tp` text export is write-only (documentation). Parsing TP text is out of scope.

---

## Driver Layer and Protocol (`src/robot/`)

- All motion goes through the active `RobotDriver`. No component calls three.js rotation directly.
- Validate joint angles against `JOINT_LIMITS` before `sendJointAngles`. Clamp + return `{ ok:false, reason:'limit' }` rather than throwing.
- Drivers return typed results; never throw for expected conditions (out of reach, lost connection).
- `protocol.ts` is the single source of the wire format. Both online drivers import its encode/decode. No driver invents its own message shape.
- Wire protocol is newline-delimited JSON: `{cmd:'jog'|'program'|'run'|'stop'|'home'|'estop', ...}` app→device, `{state:{...}}` device→app.
- `WebSocketDriver` (Ethernet/WiFi) and `WebSerialDriver` (USB) differ only in transport plumbing; everything above is shared.
- New driver behavior must not require changes outside `src/robot`.

---

## Styling

- Use CSS token variables from `ui-context.md`. No hardcoded hex.
- Follow the radius scale. Numeric readouts use `--font-mono`; never render a joint angle in the sans font.

---

## File Organization

```
src/
  kinematics/   pure FK, IK, Jacobian, manipulability + tests
  robot/        RobotDriver + SimDriver + WebSocketDriver + WebSerialDriver + protocol.ts + tests
  cad/          STL/OBJ/GLTF loaders + validation
  cell/         cell store, Cell Browser, transform-gizmo logic
  scene/        r3f: RobotArm (GLB), cell objects, frames, trail, cameras, gizmos
  pendant/      teach-pendant UI + jog hooks
  program/      instruction model, editor, playback, JSON/TP export
  frames/       tool/user frame definitions + registration
  online/       connection panel, live jog/monitor wiring, program download
  state/        zustand stores
  config/       dh-params.ts, limits, node map (single source of truth)
  ui/           shared pendant-style primitives
public/
  models/       robot-arm.glb (download from Sketchfab; gitignored)
```

Add `public/models/robot-arm.glb` to `.gitignore`. Document its source in `README.md`.
