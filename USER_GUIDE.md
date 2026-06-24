# ArmStudio — User Guide

How to use every control currently shipped (Phases 1–4). Each entry says what
it is, how to use it, and what it's for. Screens referenced: the top **status
strip**, the right-hand **teach pendant**, and the **program editor** drawer
(opens from the status strip's PROG button).

---

## Status strip (top bar)

| Control | How to use | What it's for |
|---|---|---|
| **FRAME** | Read-only. Mirrors the pendant's frame selector. | Shows which jog frame (Joint/World/Tool) is currently active. |
| **SPEED** | Read-only. Mirrors the pendant's speed override. | Shows the % speed scale currently applied to jogging or playback. |
| **PROG** *(button)* | Click it. | Opens/closes the program editor drawer over the 3D viewport. |
| **status pill** | Read-only (Ready / Moving / Hold / E-Stop). | At-a-glance robot state, in priority order E-Stop > Hold > Moving > Ready. |
| **Offline pill** | Read-only for now. | Placeholder for live connection state (Phase 7 — online hardware mode). |

---

## Teach pendant (right rail)

### Frame selector
- **What it is:** Four tabs — Joint, World, Tool, User.
- **How to use:** Click a tab to switch which frame the jog buttons move in. (User is disabled until Phase 5.)
- **What it's for:** Joint mode jogs one axis at a time; World/Tool move the tool tip in a straight line along base or tool-relative axes — useful for lining the tool up with a part instead of reasoning about six joint angles at once.

### Jog mode + step
- **What it is:** A Cont/Incr toggle plus step-size chips (1°/5°/30°/90°).
- **How to use:** Pick **Cont** for hold-to-jog (the joint/axis moves while you hold the button) or **Incr** for one fixed step per click; in Incr mode, pick a step size.
- **What it's for:** Cont is for fast, large repositioning; Incr is for precise, repeatable nudges (e.g. fine-tuning a taught point).

### Joint jog (Joint frame)
- **What it is:** Six rows (J1–J6), each with a limit bar, the live angle, and −/+ buttons.
- **How to use:** Press and hold − or + to jog that joint (Cont mode), or click once for a fixed step (Incr mode). The bar turns red near a hard limit.
- **What it's for:** Direct control of each robot joint — the most basic way to pose the arm.

### Cartesian jog (World/Tool frame)
- **What it is:** A grid of −/+ buttons for X/Y/Z (translate) and Rx/Ry/Rz (rotate).
- **How to use:** Hold a button to move the tool tip along that axis; the app solves inverse kinematics every frame so the joints follow. If the move would hit a limit or singularity, it stops automatically.
- **What it's for:** Positioning the tool tip in space (or rotating it) without manually figuring out which joints to move — closer to how an operator thinks about the job.

### Speed override
- **What it is:** A single slider, 1–100%.
- **How to use:** Drag it to scale jog speed and (during program playback) move speed.
- **What it's for:** Slow down for careful positioning or teaching near obstacles; speed up for big repositioning moves.

### TCP pose readout
- **What it is:** A read-only X/Y/Z (mm) and Rx/Ry/Rz (deg) display.
- **How to use:** Just watch it — it updates live as you jog.
- **What it's for:** Tells you exactly where the tool tip is in space, computed from the current joint angles via forward kinematics.

### Manipulability / singularity readout
- **What it is:** A read-only bar plus a red "NEAR SINGULARITY" flag.
- **How to use:** Watch it while jogging in World/Tool frame.
- **What it's for:** Warns you when the arm is approaching a configuration where it loses a degree of freedom (e.g. wrist-aligned) — Cartesian jog and program moves can fail or behave oddly near a singularity.

### Go To Pose
- **What it is:** X/Y/Z/Rx/Ry/Rz number inputs, a "Set current" button, a MOVJ/MOVL toggle, and a Go button.
- **How to use:** Type a target pose (or click "Set current" to pre-fill from where the arm is now), choose MOVJ (joint-interpolated) or MOVL (straight-line tool path), then click **Go**. If the pose is unreachable, a typed reason appears (out of reach / singularity / joint limit) instead of the arm doing nothing silently.
- **What it's for:** Jumping straight to a known pose without jogging there by hand — also a quick way to preview how MOVJ vs. MOVL would move between two points.

### Safety controls
| Button | How to use | What it's for |
|---|---|---|
| **TEACH** | Click it (any time, any frame). | Records the robot's *current* pose and joint angles as a new waypoint (P1, P2, …) in the active program — see Program Editor below. |
| **HOME** | Click it (only when motion isn't blocked). | Returns the arm to its home pose in one move. |
| **HOLD** | Click to toggle on/off. | Pauses jogging and program playback without latching — click again to resume. Also what the program editor's Pause button uses internally. |
| **E-STOP** (large red button) | Click to engage; it latches red and pulses. Click **Reset E-Stop** (appears once engaged) to clear it. | Immediately halts any motion (jog or playback) from anywhere in the app. Deliberately two-step to clear, like a real machine, so it can't be cleared by accident. |

---

## Program editor (drawer — opens from the status strip's PROG button)

### Save / Load / .tp
| Button | How to use | What it's for |
|---|---|---|
| **Save** | Click it. | Downloads the current program as a `.json` file (waypoints + instructions). |
| **Load** | Click it, then pick a previously saved `.json` file. | Replaces the active program with the loaded one. A bad or unrecognized file shows a clear error banner instead of corrupting the current program. Disabled while a program is running. |
| **.tp** | Click it. | Downloads a FANUC-style text listing of the program (line numbers, moves, and waypoint positions) — for reading/printing, not for re-importing. |

### Instruction list
- **What it is:** The numbered sequence of MOVJ / MOVL / WAIT (and CALL, see note below) lines that make up the program.
- **How to use:** Each line has ↑ / ↓ buttons to reorder it and a × to delete it. While a program is running, the line currently executing is highlighted amber, and editing buttons are disabled (so you can't edit a program mid-playback).
- **What it's for:** This *is* the program — the sequence the robot will execute, in order, top to bottom.

### Waypoints
- **What it is:** The list of points recorded with **TEACH**, each shown with its name and X/Y/Z position.
- **How to use:** Click **+J** to append a MOVJ to that point, **+L** to append a MOVL, or **×** to delete the waypoint (this also removes any instructions that referenced it).
- **What it's for:** Waypoints are the "where"; instructions (MOVJ/MOVL) are the "how to get there." Teach a point once, then reference it from as many instructions as you like.

### WAIT
- **What it is:** A seconds input and a **+ Wait** button.
- **How to use:** Type a duration, click **+ Wait** to append a WAIT line to the program.
- **What it's for:** Pausing the program for a fixed time — e.g. waiting for a gripper or a part feeder.

### Playback: Run / Pause / Stop / Step / Loop
| Button | How to use | What it's for |
|---|---|---|
| **▶ Run** | Click it. | Plays the program from the current line to the end. Each MOVJ/MOVL line uses its own recorded speed % as the active speed override while it runs. |
| **⏸ Pause** | Click it while running. | Pauses playback in place (same as pressing HOLD on the pendant) — press **Run** again to resume from where it stopped. |
| **⏹ Stop** | Click it any time after the program has moved past line 1. | Cancels the in-flight move and rewinds back to the first instruction. |
| **↓ Step** | Click it. | Runs exactly one instruction, then halts — useful for checking a program line by line before trusting it to Run. |
| **Loop** | Click to toggle on/off. | When on, Run starts back at line 1 automatically after the last instruction finishes, instead of stopping. |

If a move fails (unreachable, singular, joint limit, or aborted by E-STOP/HOLD), playback halts and a short error label appears next to the Loop button.

> **Note on CALL:** the instruction model supports a `CALL` (sub-program) type, but there's no second program to call yet and no editor button to add one — it's reserved for a future unit once multi-program management (a program registry) exists.

---

## Viewport overlay (top-left, over the 3D view)

| Control | How to use | What it's for |
|---|---|---|
| **Trail** | Click to toggle on/off. | Shows/hides the amber line tracing the tool tip's recent path, plus a live blue tool-tip marker. |
| **Clear** | Click it. | Erases the current trail so you can start tracing a fresh move. |

---

## Typical workflow

1. Jog the arm (Joint or World/Tool frame) to a pose you want to record.
2. Press **TEACH** to save it as a waypoint.
3. Repeat for every point the robot needs to visit.
4. Open the **program editor**, append MOVJ/MOVL instructions to those waypoints (and any WAIT pauses) in the order you want them executed, reordering with ↑/↓ as needed.
5. **Step** through the program once to sanity-check it, then **Run** it.
6. **Save** the program so you don't have to re-teach it next time; **Load** it back in a future session.
