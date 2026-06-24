# Architecture Context

## Stack

| Layer       | Technology                           | Role                                               |
| ----------- | ------------------------------------ | -------------------------------------------------- |
| Framework   | Vite + React + TypeScript            | App shell, build, type safety                      |
| 3D          | three.js + @react-three/fiber + drei | Arm, cell, gizmos, imported meshes                 |
| State       | zustand                              | Robot, program, cell, frames, connection           |
| Math        | gl-matrix                            | 4x4 transforms, vectors, Jacobian                  |
| CAD import  | three.js loaders (STL/OBJ/GLTF)      | Import meshes as parts/fixtures/obstacles          |
| Styling     | Tailwind CSS                         | UI from design tokens                              |
| Testing     | Vitest                               | Kinematics + protocol unit tests                   |
| Online IO   | WebSocket + Web Serial               | Live link to the real arm (two transports)         |

No backend, no auth, no database. Fully client-side. `npm install && npm run dev`.

---

## GLB Model Pipeline

The arm renders from a real GLB file (not procedural primitives).

1. Download a 6R arm GLB from https://sketchfab.com (search "6 axis robot arm", filter Free).
2. Place at `public/models/robot-arm.glb`.
3. `npx gltfjsx public/models/robot-arm.glb --types --output src/scene/RobotArm.tsx`
4. Attach a `useRef` to each link node; drive `ref.current.rotation[axis]` from joint angles in `useFrame`.

Required joint hierarchy inside the GLB (rename/reparent in Blender if needed):

```
Base → Link1(J1,Z) → Link2(J2,Y) → Link3(J3,Y) → Link4(J4,Z) → Link5(J5,Y) → Link6(J6,Z) → TCP
```

Node names map to `JOINT_NODES`; rotation axes map to `JOINT_AXES` (both in `src/config`).
Fallback: if the GLB is missing, render primitives. `VITE_ARM_MODEL` = `'glb'` | `'primitive'`.

**Current model (as supplied, Unit 3):** "Robot 6 Axis" by Mask (Sketchfab,
CC-BY-4.0) — an RBX1-style 3D-printed arm. It does **not** use `Link1..Link6`
names; it is rigged with Cinema4D `Null` empties as joint pivots plus a baked
`CINEMA_4D_Main` animation. The actual pivot chain is:

```
Null → Null_2 → Null_3 → Null_4 → Null_1 → Null_6   (Sphere mesh = tool tip)
```

Decision (user): keep this model and drive its real `Null` nodes; re-rig to the
clean `Link1..Link6` hierarchy in Blender later. `RobotArm.tsx` auto-centers +
drops the model to the floor, so a future re-rigged model swaps in cleanly.

**Unit 6 finding — the rig is only 4-DOF.** The baked `CINEMA_4D_Main`
animation drives just four pivots; `Null`/`Null_2` are identity holders. Mapping
(local axes recovered empirically from the animation keyframes):

| Joint        | Node     | Local axis |
|--------------|----------|------------|
| J1 waist     | `Null_3` | X          |
| J2 shoulder  | `Null_4` | Z          |
| J3 elbow     | `Null_1` | X          |
| J5 wrist pitch | `Null_6` | Z        |
| J4 roll, J6 roll | —    | none (baked into wrist; inert until re-rig) |

This model→joint adapter lives in `src/config/glb-joint-map.ts` (keeps the
locked DH `JOINT_NODES`/`JOINT_AXES` as the clean 6-joint target). The scene
drives the GLB from it in one `useFrame` loop, reading angles from
`src/state/robotStore.ts`. Re-rigging to `Link1..Link6` lets us delete the
adapter and drive straight from `JOINT_NODES`/`JOINT_AXES`.

---

## CAD Import Pipeline (mesh only)

Imported objects are geometry, never code. Supported formats: **STL, OBJ, GLTF/GLB only.**

- Loaders: `STLLoader`, `OBJLoader`, `GLTFLoader` from `three/examples/jsm/loaders`.
- Entry points: drag-and-drop onto the viewport, or a file picker in the Cell Browser.
- Flow: file → loader → `THREE.BufferGeometry` / `Group` → wrap as a `CellObject` → push to the cell store.
- On import, the user assigns the object a type: `part` | `fixture` | `obstacle`.
- `src/cad/` owns loading + validation. `src/cell/` owns the placed-object store. The scene reads the store.
- Validation: reject unsupported extensions, cap file size (e.g. 50 MB), center geometry, report load errors to the UI. Never `eval`, never run embedded scripts.
- STEP / IGES are out of scope (would need `occt-import-js`). Reject with a clear message.

---

## DH Parameters (locked — change only with tracker update)

6R spherical-wrist arm, ~710 mm reach. Standard (distal) DH. Lengths mm, angles
degrees. (Corrected from "Modified DH" in Unit 5: these locked values only form
a valid waist/shoulder/elbow arm under standard DH — see progress-tracker.md.
DH values and limits are unchanged.)

```ts
// src/config/dh-params.ts
export const DH_PARAMS = [
  { a:   0, d: 200, alpha:  90, thetaOffset: 0 }, // J1 waist
  { a: 200, d:   0, alpha:   0, thetaOffset: 0 }, // J2 shoulder
  { a:  50, d:   0, alpha:  90, thetaOffset: 0 }, // J3 elbow
  { a:   0, d: 200, alpha: -90, thetaOffset: 0 }, // J4 wrist roll
  { a:   0, d:   0, alpha:  90, thetaOffset: 0 }, // J5 wrist pitch
  { a:   0, d:  60, alpha:   0, thetaOffset: 0 }, // J6 tool roll
] as const;

export const JOINT_LIMITS = [
  { min: -170, max: 170 }, { min: -90, max: 90 }, { min: -180, max: 60 },
  { min: -170, max: 170 }, { min: -120, max: 120 }, { min: -170, max: 170 },
] as const;

export const HOME_ANGLES = [0, 0, 0, 0, 0, 0];
export const JOINT_NODES = ['Link1','Link2','Link3','Link4','Link5','Link6'] as const;
export const JOINT_AXES  = ['z','y','y','z','y','z'] as const;
```

---

## System Boundaries

- `src/kinematics/` — pure FK, IK, DH chain, Jacobian, manipulability. No React/three.js/DOM.
- `src/robot/` — `RobotDriver` interface + `SimDriver`, `WebSocketDriver`, `WebSerialDriver`, and the shared wire `protocol.ts`.
- `src/cad/` — mesh loaders (STL/OBJ/GLTF), validation, file → geometry.
- `src/cell/` — cell store (placed objects), Cell Browser tree, transform-gizmo logic.
- `src/scene/` — r3f: `RobotArm` (GLB), cell objects, frames, trail, TCP marker, cameras, gizmos.
- `src/pendant/` — teach-pendant UI: jog, frame selector, speed, HOLD, E-STOP, HOME.
- `src/program/` — instruction model, editor, playback engine, JSON + TP export.
- `src/frames/` — tool/user frame definitions and registration.
- `src/online/` — connection panel, driver selection, live jog/monitor wiring, program download.
- `src/state/` — zustand stores, single-concern: `robotStore` (joint pose),
  `pendantStore` (jog frame/mode/step/speed), `machineStore` (estop/hold/moving
  + `deriveStatus`), `settingsStore` (view toggles — TCP trail); program, cell,
  frames, connection stores arrive in their phases.
- `src/config/` — DH params, limits, node map. Single source of truth. Also
  `glb-joint-map.ts`: model-specific adapter mapping J1..J6 → the current GLB's
  real pivot nodes/axes (the supplied model is a 4-DOF baked rig; delete on
  re-rig). Keeps `dh-params.ts` as the clean 6-joint target.
- `src/ui/` — shared pendant-style primitives.

Implemented so far (Phases 1–3): `src/config/{dh-params,glb-joint-map}.ts`,
`src/kinematics/{forward,dh,units,linalg,rotation,jacobian,inverse}.ts`
(+ `forward/linalg/jacobian/inverse.test.ts`),
`src/state/{robotStore,pendantStore,machineStore,settingsStore}.ts`
(+ `machineStore.test.ts`), `src/program/{motion.ts (+ motion.test.ts),
useMotion.ts}`, `src/scene/*` (incl. `TcpTrail`, `ViewportOverlay`),
`src/ui/{PendantButton,FrameTab,SpeedSlider,JogButton,JointBar,StatusPill}.tsx`,
`src/pendant/{Pendant,FrameSelector,JogModeSelector,JointJog,CartesianJog,
SpeedOverride,PoseReadout,KinematicsReadout,GoToPose,SafetyControls,StatusStrip}.tsx`
+ `useJog.ts` + `jogMath.ts` (+ `jogMath.test.ts`), `src/types.ts`. The full
kinematics API (`forwardKinematics`, `inverseKinematics`, `computeJacobian`,
`manipulability`) now exists. `src/{robot,cad,cell,frames,online}/` and the rest
of `src/program/` (instruction model, editor) arrive in their phases.

**Scene coordinate mapping:** FK works in a Z-up DH base frame; the three.js
scene is Y-up. FK geometry (TCP marker, trail) is mapped (x,y,z)→(x,z,−y) and
anchored to the base triad at the origin — it is *not* attached to the GLB mesh,
which is auto-centered/floor-seated and (on the current 4-DOF model) does not
match FK. A re-rig aligns them later.

---

## Driver Interface and Wire Protocol

All robot motion goes through one active `RobotDriver`. The three drivers are
first-class: simulation and both online transports implement the same interface.

```ts
interface RobotDriver {
  connect(): Promise<void>;
  sendJointAngles(angles: number[]): Promise<void>; // 6 angles, degrees
  sendProgram(program: Program): Promise<void>;      // download to device
  readState(): Promise<RobotState>;
  onState(cb: (s: RobotState) => void): void;        // live monitor stream
  disconnect(): Promise<void>;
  readonly connected: boolean;
}
```

- `SimDriver` — drives the GLB arm in-app.
- `WebSocketDriver` — connects to an ESP32 / Raspberry Pi bridge over Ethernet/WiFi.
- `WebSerialDriver` — connects to a Teensy over USB via the Web Serial API.

### Shared wire protocol (our own, transport-agnostic)

Both online drivers speak the **same newline-delimited JSON**, so swapping
transport changes nothing above the driver. Defined in `src/robot/protocol.ts`.

```
App → device:
  {"cmd":"jog","angles":[j1,j2,j3,j4,j5,j6]}      // live setpoint, ~20 Hz
  {"cmd":"program","program":{...}}               // download taught program
  {"cmd":"run"} | {"cmd":"stop"} | {"cmd":"home"} | {"cmd":"estop"}

Device → app:
  {"state":{"angles":[...],"moving":true,"fault":null}}
```

Switching Simulation ↔ Ethernet ↔ USB = changing the active driver only.

---

## Storage Model

- **In-memory (zustand)**: robot state, program, cell layout, frames, connection.
- **JSON export/import**: programs and cell layouts saved via browser download/upload.
- **Imported meshes**: held in memory as geometry; the cell JSON stores a reference + transform, not the mesh bytes.
- **Source config**: DH params and limits in `src/config`.
- **localStorage (optional)**: cache last program/settings. Never required for correctness.

---

## Invariants

1. `src/kinematics/` is pure. No React, three.js, DOM, or side effects.
2. Every motion command goes through the active `RobotDriver`.
3. UI uses mm/degrees; math uses radians/meters. Convert at the boundary only.
4. Joint angles are validated against `JOINT_LIMITS` before any driver send.
5. IK returns `{ ok:true, angles }` or `{ ok:false, reason:'unreachable'|'singular'|'limit' }`. Never silent.
6. GLB joint rotation is driven from `JOINT_AXES` config; no hardcoded axis in scene code.
7. All DH constants come from `src/config` only.
8. Both online drivers emit the identical wire protocol from `protocol.ts`. No transport-specific message shapes.
9. Imported CAD is geometry only — validated by extension and size, never executed.
10. Switching driver (Sim / WebSocket / WebSerial) requires no change outside `src/robot`.
