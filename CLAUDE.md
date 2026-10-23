# BlueprintOS

A browser-based 2D floor plan editor for sketching a house layout to hand to an architect. The user is a non-technical homeowner who wants to try out room sizes, check them against the lot and print a clean base plan. The architect handles structure, plumbing and building codes; this tool does not.

**This is a small, short-lived personal project.** Choose the simplest thing that works. A feature only belongs here if it helps the homeowner reason about space or talk to the architect.

*Universal engineering and documentation rules are in `~/.claude/CLAUDE.md`. This file adds project-specific rules and overrides.*

## Origin and stack

Forked from [ahmethakanbesel/floor-maker](https://github.com/ahmethakanbesel/floor-maker). Its README says MIT, but the repo has no LICENSE file. Keep the upstream attribution in the README.

- React 19 + TypeScript (~5.9), Vite 7, Tailwind CSS v4
- Konva via `react-konva` for the canvas
- Zustand 5 for state (Immer is installed but unused). Undo/redo: `stores/history.ts` records plan changes into `historyStore.ts` (FDD-0006).
- jsPDF for PDF export, lucide-react for icons, framer-motion for UI motion
- **npm, not Bun.** Upstream scripts use `bunx --bun`; rewritten to plain `vite` / `tsc` commands.
- Fully static, no backend. Projects save as JSON files and autosave to the browser. Deployed to Vercel's free tier.

## Commands

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc -b && vite build
npm run lint
npm test          # vitest run
```

Before calling a change done, run `npm run build` (it type-checks) and `npm test`.

## Layout (inherited from upstream)

- `src/types/`: domain types (`rooms.ts`, `geometry.ts`, `project.ts`, `objects.ts`, `dimensions.ts`)
- `src/utils/geometry.ts`: pure geometry helpers (area, perimeter, snapping)
- `src/stores/`: Zustand stores, one per domain (`projectStore`, `selectionStore`, `toolStore`, `historyStore`, ...)
- `src/components/canvas/`: `FloorCanvas.tsx`, `layers/` (Grid, Room, Object, Interaction), `shapes/`
- `src/components/panels/`, `layout/`, `ui/`: the Tailwind UI around the canvas
- `src/i18n/translations.ts`: every user-facing string
- `src/constants/`: grid, zoom, wall and colour constants

## Domain rules

### Units and precision
- **Stored unit: centimetres, as integers.** Round to whole cm wherever geometry is written to the store to prevent float drift. Do not migrate to millimetres.
- **Displayed unit: metres.** Lengths as metres (2 decimals) and areas as m² (2 decimals), formatted for pt-BR (`Intl.NumberFormat('pt-BR')` → `3,45 m`, `12,60 m²`). Inputs accept comma or dot as decimal separator.
- Only the render layer converts cm to pixels. Zoom and pan never modify stored coordinates.
- Imperial units are out of scope. The metric setting stays; the toggle may be hidden.

### Language
- **UI is Brazilian Portuguese (`pt-BR`).** Add `pt-BR` to `Language` in `translations.ts`. All new strings go through the translation table; no hardcoded UI text in components. Keep `en`, remove `tr` if it gets in the way.
- Standard Brazilian architectural vocabulary: planta baixa, cômodo, parede, porta, janela, área útil, área construída, terreno, recuo, escala, cota.
- Code, identifiers, comments and commits stay in English.

### Shared walls (the core feature)
Each `Room` owns its own corners and walls, so two adjacent rooms hold two coincident wall copies. **Do not rewrite this into a DCEL.** Use the simpler approach:
- Snap dragged or new corners onto any existing corner within snap tolerance so coincident corners share identical integer coordinates.
- Corners from different rooms at identical coordinates are linked. Dragging one moves all linked corners in one store update (one undo step).
- Dragging a wall moves both endpoints and all linked corners; the neighbouring room resizes automatically.
- Linking and move logic lives in a pure function in `src/utils/` (rooms in → rooms out). The store calls it; components only dispatch.
- Reject moves that collapse a room's area to zero or negative, or cause self-intersection.

Cassowary/kiwi, Clipper2 boolean cutouts and mitre-joint maths are **out of scope** unless a concrete problem demands them.

### Features to add, in priority order
1. **pt-BR localisation** and metre display
2. **Shared walls**, as described above
3. **Room programme (programa de necessidades):** target area per room; panel shows target vs. actual and total built area.
4. **Lot (terreno):** lot outline with setbacks (recuos); warning when a room crosses the line; lot area and occupancy percentage.
5. **Architect export:** PDF at 1:50 / 1:100 scale with scale bar, room labels, area table and title block.

## Engineering rules (project-specific)

### Behaviour
- **Scope strictness.** Change only what the task needs. Do not reformat or rewrite files for small changes.
- **No API hallucination.** Do not invent signatures for Konva, react-konva, Zustand or jsPDF. Check `node_modules` or say so.
- **Push back** on over-engineering. The feature list is fixed and small.
- **Protected code.** Never modify a line marked "do not touch".
- **Upstream conventions win.** PascalCase component files (`FloorCanvas.tsx`), camelCase stores and utils (`projectStore.ts`). Do not rename upstream files.

### Architecture: logic vs. rendering (Konva specifics)
- **Logic** (`src/utils/`, `src/types/`, store actions): no React or Konva imports.
- **Rendering** (`src/components/`): no geometry maths inside components.
- Konva performance: `listening={false}` on the grid, dimension labels and non-interactive shapes. Separate static content from the active drag layer. Optimise only when a real slowdown appears.

### TSDoc example for this codebase

```ts
/**
 * Computes the internal area of a room using the Shoelace formula.
 *
 * @remarks
 * Rooms can be drawn clockwise or counter-clockwise, so the signed Shoelace
 * sum is returned as an absolute value.
 *
 * @param points - Room outline in drawing order, in whole centimetres.
 * @returns Area in square centimetres.
 * @throws {Error} When fewer than three points are provided.
 * @example
 * computeRoomArea([{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 300 }, { x: 0, y: 300 }])
 * // → 120000 (cm², i.e. 12,00 m²)
 */
export function computeRoomArea(points: Point[]): number { … }
```

### Debugging (canvas-specific)
- **Zustand DevTools.** Use `devtools` middleware from `zustand/middleware` when `import.meta.env.DEV` is true.
- **Debug flag.** Gate verbose logs behind `import.meta.env.VITE_DEBUG === 'true'` in `.env.local`.
- **Canvas hit-testing.** Add a temporary `<Rect>` or `<Circle>` in the Interaction layer to visualise bounding boxes. Remove before committing.
- **Coordinate logging.** Keep `logPt(label, point)` in `src/utils/debug.ts` (format: `"label (x cm, y cm)"`). Development-only import.

### Testing focus
- Required coverage: geometry, unit conversion, corner linking, shared-wall moves, rejection of invalid moves, cm/m formatting.
- Factory helper: `makeRectRoom(x, y, w, h)`.

## Documentation (project-specific)

*Universal documentation rules apply. These additions are specific to this project.*

### FDD workflow
Claude drafts the FDD (`Draft`) → Victor reviews (`In Review`) → Victor approves (`Approved`) → implementation starts (`In Progress`) → all DoD items checked → `Implemented`. No code starts before the FDD status is `Approved`.

### FDDs for this project
Each feature in the priority list gets an FDD before code starts:
- `0001` pt-BR and metres
- `0002` shared walls
- `0003` room programme
- `0004` lot and setbacks
- `0005` architect export
- `0006` undo and redo (added; done before 0005)
- `0007` plan options in tabs (added; done before 0005)

### No backend
BlueprintOS has no backend. In Section 5 of every FDD, replace the backend sub-sections with **5.5 Persistence** — saved project JSON schema changes and backward-compatibility for older files.

### Documentation language
Engineering docs (README, FDDs, ADRs) are in English. UI element names use pt-BR labels where helpful (e.g., *Programa de necessidades*). User-facing guides, if any, are in pt-BR.
