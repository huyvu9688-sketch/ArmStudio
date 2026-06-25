# ArmStudio

## Overview

ArmStudio is a Roboguide-equivalent browser app for offline programming and
simulation of a 6-axis robot arm. It renders a real arm from a GLB model, lets
you import CAD meshes as parts/fixtures/obstacles and arrange them in a 3D cell,
provides a FANUC-style teach pendant, and includes an offline programmer for
building and testing motion routines. An online mode connects to the real arm
(over Ethernet/WiFi or USB) to jog it live, monitor it, and download taught
programs. The same control code drives simulation and hardware — only the active
driver changes.

The user is a mechanical/automation engineer studying a full 6-axis system,
building pick-and-place programs, and validating them visually before committing
to hardware. Correct robotics behavior and a UI that mirrors real pendants
(FANUC iPendant / KUKA smartPAD) matter more than visual polish.

> Independent build. ArmStudio mimics the Roboguide *workflow and functions*. It
> does not copy FANUC software, 3D assets, or protocols. The app-to-robot wire
> protocol is our own (simple JSON), documented in `architecture.md`.

---

## Roboguide Feature Parity (the target)

| Roboguide feature              | ArmStudio equivalent                                          |
|--------------------------------|---------------------------------------------------------------|
| Robot model in 3D cell         | GLB arm in a 3D scene with floor, fixtures, obstacles          |
| Cell Browser tree              | Tree of robot / parts / fixtures / obstacles / targets         |
| Load CAD data as part/fixture  | Import STL / OBJ / GLTF meshes as parts, fixtures, obstacles    |
| Position objects (green triad) | Transform gizmo: drag to move, shift-drag to rotate per object  |
| Virtual teach pendant          | On-screen pendant: jog (joint/world/tool), HOLD, E-STOP        |
| Teach waypoints                | Teach button records current pose as a program point           |
| TP program editor              | Ordered instruction list: MOVJ, MOVL, WAIT, CALL              |
| Program run / step / trace     | Run / Step / Pause / Stop with active-line highlight + trail   |
| Tool/user frame registration   | Tool frame and user frame definition panels                   |
| Reach / interference check     | Reachability test for any target; singularity warning          |
| Connect to actual robot        | Online mode: connect over WebSocket (Ethernet/WiFi) or Web Serial (USB) |
| Monitor actual robot motion    | Live joint-state readback streamed into the 3D view            |
| Jog actual robot from app      | Same jog controls drive the real arm when an online driver is active |
| Download program to controller | Serialize program → send over the active link → firmware stores/plays |

---

## Goals

1. Render a real 6-DOF arm from a GLB model with correct FK-driven joint motion.
2. Import STL/OBJ/GLTF meshes and arrange them as parts, fixtures, and obstacles in a 3D cell.
3. Provide a FANUC-style teach pendant: jog all frames, teach waypoints, run programs.
4. Implement an offline programmer: write, edit, step through, and simulate MOVJ/MOVL routines.
5. Provide an online mode that jogs, monitors, and downloads programs to the real arm over either transport, behind one driver interface.

---

## Core User Flow

1. User opens the app — the GLB arm renders in a 3D cell with the pendant docked.
2. User imports CAD meshes (a gripper, a table, a part) and positions them with the transform gizmo.
3. User jogs the arm with the pendant and presses Teach to record poses as waypoints.
4. User builds a program (MOVJ/MOVL/WAIT), runs it in simulation, checks the TCP trace and reach.
5. User connects to the real arm (Ethernet/WiFi or USB), jogs it live to verify, and monitors its motion.
6. User downloads the validated program to the arm's firmware over the same link, runs it on hardware.

---

## Features

### 3D Cell (Roboguide: Cell Browser)
- Real GLB robot model with named joint nodes; primitive fallback if no GLB present
- Cell Browser tree: robot, parts, fixtures, obstacles, targets
- CAD mesh import (STL / OBJ / GLTF) via drag-and-drop or file picker
- Per-object transform gizmo: drag axis to move, shift-drag to rotate
- Object property panel: position, rotation, scale, type (part/fixture/obstacle), color
- Multiple camera views: orbit, front, side, top, TCP-follow

### Teach Pendant (Roboguide: Virtual TP)
- FANUC iPendant-style panel: jog J1–J6 and Cartesian X/Y/Z/Rx/Ry/Rz
- Frame selector (Joint / World / Tool / User), speed override; jog is drag-the-bar or click-to-edit-exact-value (no held/incremental jog mode — see progress-tracker.md)
- HOLD, E-STOP (red, prominent), HOME
- Status strip: active frame, speed %, program name, connection state

### Kinematics Engine
- Forward kinematics from the DH chain
- Inverse kinematics by damped least squares; typed result (ok / unreachable / singular / limit)
- Singularity warning, per-joint limit bars, manipulability readout

### Offline Programmer (Roboguide: TP Program Editor)
- Instructions: `MOVJ P[n] speed%`, `MOVL P[n] speed mm/s`, `WAIT sec`, `CALL routine`
- Teach point by jogging + Teach, or direct coordinate entry
- Add / delete / reorder; Run / Pause / Stop / Step; loop toggle
- TCP motion trail; active-line highlight
- Save / load as JSON; export as `.tp` text (FANUC TP approximation, documentation only)

### Tool and User Frames
- Tool frame definition (direct entry + 3-point method, simulated)
- User frame definition (3-point origin/X/Y method)
- Active tool + user frame selectable from the pendant

### Online Mode (Roboguide: Connection With The Actual Robot)
- Connection panel: pick driver (Simulation / Ethernet-WiFi / USB), connect, disconnect, status
- Live jog: the same pendant controls drive the real arm when an online driver is active
- Live monitor: joint state streamed back from the arm into the 3D view
- Program download: serialize the program and send it over the active link to firmware
- One shared wire protocol (JSON) used by both online transports — see `architecture.md`

### Study and Visualization Tools
- Toggle DH coordinate frames (XYZ gizmos per joint)
- Work envelope visualization
- Live-editable DH parameter panel
- Reach test: click a point in 3D, see reachability and IK solution
- Singularity map overlay on the envelope

---

## Scope

### In Scope
- Seven phases in `progress-tracker.md`
- Single 6R spherical-wrist arm, kinematics only
- CAD import: **mesh formats only — STL, OBJ, GLTF/GLB**
- Both online transports specced behind the driver interface: WebSocket (Ethernet/WiFi bridge) and Web Serial (USB)
- Local, single-user, client-side; no backend, no accounts

### Out of Scope
- Native CAD formats (STEP, IGES) — would need a WASM kernel; deferred
- Physics / dynamics simulation (mass, torque, inertia)
- Real collision detection (visual overlap highlight only)
- Copying FANUC software, assets, or protocols
- Multi-robot cells; cloud sync

## Success Criteria

1. The GLB arm renders and all six joints move correctly from jog controls.
2. A user imports an STL/OBJ/GLTF mesh and positions it in the cell with the gizmo.
3. Jogging in World frame moves the TCP along world axes via IK; MOVL traces a straight line.
4. A 3+ step program can be taught, run, stepped, and re-run repeatably.
5. Tool frame and user frame can be defined and switched.
6. Selecting an online driver and connecting lets the same jog controls drive a connected device, with state streamed back.
7. A program exports as JSON and downloads over the active link; the wire format is documented for firmware.
8. Switching between Simulation, WebSocket, and Web Serial drivers requires no change outside `src/robot`.
