# ArmStudio

A Roboguide-equivalent browser app for offline programming and simulation of a
6-axis robot arm: real GLB arm in a 3D cell, CAD mesh import (STL/OBJ/GLTF),
FANUC-style teach pendant, an offline MOVJ/MOVL/WAIT programmer, and an online
mode that jogs, monitors, and downloads programs to a real arm over
Ethernet/WiFi (WebSocket) or USB (Web Serial).

Independent build — mimics the Roboguide *workflow and functions* only. No FANUC
software, assets, or protocols are used; the app-to-robot wire protocol is our
own (simple JSON). See `context/` for the full spec and `CLAUDE.md` for the
build process.

## Stack

Vite + React + TypeScript · three.js / @react-three/fiber / drei · zustand ·
gl-matrix · Tailwind CSS v4 · Vitest.

## Develop

```bash
npm install
npm run dev      # dev server
npm run build    # typecheck + production build
npm run test     # Vitest (kinematics + protocol tests)
```

## Robot model (required before Phase 1, Unit 3)

The arm renders from a real GLB file, supplied by the user (not generated):

1. Download a free 6R arm GLB from https://sketchfab.com (search
   "6 axis robot arm", filter Free).
2. Place it at `public/models/robot-arm.glb` (gitignored — binary asset).
3. Run `npx gltfjsx public/models/robot-arm.glb --types` and share the output so
   joint node names can be matched to `JOINT_NODES` in `src/config`.

If the GLB is missing, the scene falls back to primitives
(`VITE_ARM_MODEL=primitive`).

## Build status

See `context/progress-tracker.md`. Currently: **Phase 1, Unit 1 (scaffold) — complete.**
