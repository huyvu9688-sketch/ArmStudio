# ArmStudio — Application Building Context

ArmStudio is a Roboguide-equivalent browser app: real GLB robot arm, CAD mesh
import (STL/OBJ/GLTF) into a 3D cell, FANUC-style teach pendant, offline
programmer (MOVJ/MOVL/WAIT), and an online mode that jogs, monitors, and
downloads programs to a real arm over Ethernet/WiFi or USB. Build in seven
phases, one unit at a time.

Independent build: mimic the Roboguide workflow and functions only. Do not copy
FANUC software, assets, or protocols. The app-to-robot wire protocol is our own.

---

## First-time setup (run once before Phase 1)

```bash
npm create vite@latest armstudio -- --template react-ts
cd armstudio
npm install three @react-three/fiber @react-three/drei zustand gl-matrix tailwindcss lucide-react
npm install -D vitest @vitest/ui
```

Drop this `CLAUDE.md` and the `context/` folder into `armstudio/`.

Before Phase 1 unit 3 (GLB model):
1. Get a 6R arm GLB from https://sketchfab.com (search "6 axis robot arm", filter Free).
2. Place it at `public/models/robot-arm.glb`.
3. Run `npx gltfjsx public/models/robot-arm.glb --types` and share the output with the agent.
4. Add `public/models/robot-arm.glb` to `.gitignore`.

---

## Start of every session — paste this to the agent

```
Read CLAUDE.md and all files in context/ in the order listed.
Check progress-tracker.md for the current phase and unit.
Build the next unit only. Stop after it runs in the browser and confirm
before moving to the next unit. Do not start the next phase until I say so.
```

---

## Read order

1. `context/project-overview.md` — goals, Roboguide parity, scope
2. `context/architecture.md` — stack, GLB + CAD pipelines, DH config, drivers + wire protocol, invariants
3. `context/ui-context.md` — pendant, cell browser, connection panel layouts, tokens
4. `context/code-standards.md` — types, kinematics/CAD/driver rules, file tree
5. `context/ai-workflow-rules.md` — scoping, GLB/CAD/online rules, doc-sync table
6. `context/progress-tracker.md` — current phase, completed units, open questions

---

## After every meaningful change

- Mark the unit complete in `progress-tracker.md`
- Update the relevant context file if architecture, scope, protocol, or standards changed
- `npm run build`, `npm run lint`, and `npm run test` must all pass before moving on
