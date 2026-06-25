# UI Context

## Theme

Dark only. No light mode. The design language mirrors a FANUC iPendant /
KUKA smartPAD: near-black graphite panels, hard-edged physical buttons,
monospaced telemetry, safety-amber for active/motion, hard red for E-STOP,
limits, and singularities. The 3D viewport is dominant; panels surround it.
Not a SaaS dashboard.

---

## Colors

All components use these tokens. No hardcoded hex in component code.

| Role                  | CSS Variable        | Value     |
| --------------------- | ------------------- | --------- |
| Page background       | `--bg-base`         | `#0F1114` |
| Panel surface         | `--bg-surface`      | `#181C23` |
| Raised surface        | `--bg-surface-2`    | `#21262F` |
| Input / well          | `--bg-well`         | `#131720` |
| Border default        | `--border-default`  | `#2A3040` |
| Border emphasis       | `--border-emphasis` | `#3D4860` |
| Primary text          | `--text-primary`    | `#E8ECF2` |
| Muted text            | `--text-muted`      | `#8A95A8` |
| Faint text            | `--text-faint`      | `#586070` |
| Safety amber          | `--accent-amber`    | `#F5A623` |
| Structure blue        | `--accent-blue`     | `#4A9EE8` |
| Ready green           | `--state-ready`     | `#3DBD7A` |
| Warning               | `--state-warning`   | `#F0B429` |
| Error / limit / ESTOP | `--state-error`     | `#E8453C` |
| Online / connected    | `--state-online`    | `#3DBD7A` |
| Offline               | `--state-offline`   | `#586070` |
| Part (cell object)    | `--obj-part`        | `#4A9EE8` |
| Fixture (cell object) | `--obj-fixture`     | `#8A95A8` |
| Obstacle (cell object)| `--obj-obstacle`    | `#F0B429` |

Amber = motion active, selected item, speed override. Blue = links, frames,
parts. Red = E-STOP, limit reached, singularity, out of reach. Green = ready /
connected.

---

## Typography

| Role             | Font           | Variable      |
| ---------------- | -------------- | ------------- |
| UI labels        | Space Grotesk  | `--font-sans` |
| Telemetry / code | JetBrains Mono | `--font-mono` |

All numeric readouts (pose, angles, speed, coordinates, program line numbers,
connection address) use `--font-mono`.

---

## Border Radius

| Context              | Value / Class    |
| -------------------- | ---------------- |
| Pendant buttons      | `rounded-sm`     |
| Inputs               | `rounded-md`     |
| Panels / cards       | `rounded-lg`     |
| Modal overlays       | `rounded-xl`     |
| E-STOP button        | `rounded-full`   |

---

## Layout

- App shell: full-viewport, no page scroll.
- Desktop: left rail = Cell Browser tree (collapsible). Center = 3D viewport. Right = teach pendant (340px fixed). Program editor and connection panel open as right-side drawers or overlays. Top status strip spans full width.
- Mobile: viewport on top; pendant as a bottom sheet; Cell Browser, program editor, connection panel open full-screen.
- Top status strip: active frame, speed %, program name, robot status pill, connection pill, E-STOP.

## Cell Browser (left rail)

```
┌─ Cell ──────────────┐
│ ▸ Robot             │
│ ▾ Parts             │
│    • gripper.stl    │
│ ▾ Fixtures          │
│    • table.obj      │
│ ▾ Obstacles         │
│    • wall.stl       │
│ ▸ Targets           │
│ [+ Import CAD]      │
└─────────────────────┘
```
Click a node to select it (shows its transform gizmo + property panel).
"Import CAD" opens a file picker; drag-drop onto the viewport also imports.

## Teach Pendant (right, 340px)

```
[Frame] Joint World Tool User
[Mode]  Cont Incr [Step 1°]
J1 [−][+]   J4 [−][+]
J2 [−][+]   J5 [−][+]
J3 [−][+]   J6 [−][+]
Speed [====|====] 50%
J1 ██████░░ −170/170   (limit bars)
X 0.0 mm  Rx 0.0°       (TCP pose)
Y 0.0 mm  Ry 0.0°
Z 200 mm  Rz 0.0°
[TEACH] [HOME] [●HOLD]
[       E-STOP        ]
```

## Connection Panel (online mode)

```
┌─ Connection ────────────────┐
│ Driver:  ( ) Simulation     │
│          ( ) Ethernet/WiFi  │
│          ( ) USB serial     │
│ Address: ws://192.168.1.50  │  (Ethernet only)
│ [ Connect ]   ● Offline     │
│ ─────────────────────────── │
│ Live jog  [on/off]          │
│ Monitor   ● streaming       │
│ [ Download program ]        │
└─────────────────────────────┘
```

## Program Editor

```
Program: pick_place_v1   [Save][Load][.tp]
1 MOVJ P[1] 50%        ← active (amber)
2 MOVL P[2] 100 mm/s
3 WAIT 0.5s
4 MOVL P[3] 100 mm/s
[▶Run][⏸Pause][⏹Stop][↓Step] [+Add][×Del][↑][↓][Loop ○]
```

---

## Component Library

Tailwind + bespoke primitives in `src/ui/`:
`JointBar`, `EditableAngle`, `FrameTab`, `SpeedSlider`, `PoseReadout`, `StatusPill`,
`ConnectionPill`, `PendantButton`, `InstructionRow`, `CellTreeNode`, `ObjectPropertyPanel`.

Icons: `lucide-react`, stroke-based, 16px inline / 20px buttons.

**Built so far (Phase 2, revised later in Phase 3+):** the real `src/ui/`
primitives now exist — `PendantButton` (variants default/amber/danger/ready +
`active` toggle fill), `FrameTab` (segmented tab, disabled state),
`SpeedSlider`, `JointBar` (draggable limit/value bar — press or drag anywhere
along it to set the value proportionally, with a round thumb at the current
value; red near a hard stop, suppressible via `limitWarning={false}` when the
range is a display window rather than a real travel limit), `EditableAngle`
(click a numeric readout to type an exact value), `StatusPill` (dot + label,
tone + optional pulse). `ConnectionPill` is deferred to Phase 7 — the status
strip uses `StatusPill` with the `offline` tone meanwhile. (The original
`JogButton` hold-to-jog +/- pair and the Cont/Incr mode selector were replaced
by the drag-bar/exact-entry pair and removed — see progress-tracker.md.)

The full teach pendant is composed in `src/pendant/`: `Pendant` (panel),
`FrameSelector`, `JointJog` (drag-bar + exact-entry per joint, replacing the
Phase-1 sliders and the later +/- buttons), `CartesianJog` (same pattern for
World/Tool/User, X/Y/Z/Rx/Ry/Rz via IK), `SpeedOverride`, `PoseReadout`,
`SafetyControls` (TEACH/HOME/HOLD + latched E-STOP). The top status strip is
live in `src/pendant/StatusStrip.tsx` (extracted from `App.tsx`), reflecting
frame / speed / robot status from the pendant + machine stores.

Pendant section order matches the layout above, minus the Mode/Step row (removed):
Frame → Joint/Cartesian jog (drag-bar + exact-entry per row, limit bars merged
into each row) → Speed → TCP pose → safety. `PoseReadout` remains in
`src/pendant/`.

**Added in Phase 3:** the Frame selector now enables Joint/World/Tool (User stays
disabled until Phase 5). When World/Tool is active the pendant swaps the joint
grid for `CartesianJog` (X/Y/Z/Rx/Ry/Rz +/-, driven by live IK). New pendant
sections: `KinematicsReadout` (manipulability % bar + "near singularity" flag,
red) and `GoToPose` (X/Y/Z/Rx/Ry/Rz inputs + MOVJ/MOVL toggle + Go, with a typed
IK-failure message). A `ViewportOverlay` (HTML over the 3D canvas, top-left) holds
the TCP-trail toggle + Clear; the amber trail and blue TCP marker render in the
viewport. Singularity / out-of-reach / limit conditions read in the safety palette
(red), consistent with the tokens.

**Added in Phase 4:** `ProgramEditor.tsx` (right-side drawer per the layout
above) renders the instruction list and waypoint list inline rather than via a
standalone `InstructionRow` component — kept as plain rows for now since
Run/Step/Pause/Stop playback (next unit) will likely change each row's shape
(an active-line highlight). TEACH (`SafetyControls.tsx`) is now live.

**Added in Phase 5:** the Cell Browser (left rail) is live in
`src/cell/CellBrowser.tsx` using the new `src/ui/CellTreeNode.tsx`
(`CellTreeSection` collapsible header, `CellTreeLeaf` colored-dot row with a
hover delete) — Robot/Parts/Fixtures/Obstacles/Targets per the mock above,
plus a real "+ Import CAD" file picker and viewport drag-drop (with the
floor-raycast placement code-standards.md describes). Selecting an object
shows `src/cell/ObjectPropertyPanel.tsx` (the `ObjectPropertyPanel` from the
component library) below the tree: type (reusing `FrameTab`), color swatches
+ a native color input, and position/rotation/scale number grids — the same
data a drei `TransformControls` gizmo (mounted in `scene/CellObjects.tsx`)
writes when you drag-edit the object in the viewport, so both stay in sync.
The Frame selector's User tab is now enabled (Joint/World/Tool/User all
active); the pendant gained `src/frames/FramePanel.tsx`, a collapsible
section for registering tool/user frames (name, active toggle, a 6-field
mm/deg offset editor, delete) — direct-entry only, per the gap noted in
progress-tracker.md. `ViewportOverlay.tsx` gained an Orbit/Front/Side/Top/TCP
button row (top-left, next to Trail/Clear) for the Phase 5 · Unit 7 camera
presets.

Still pending (later phases): `ConnectionPill`; DH-frame/envelope toggles
(Phase 6).
