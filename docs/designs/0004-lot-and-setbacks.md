---
id: FDD-0004
title: Lot and setbacks
status: Implemented
owner: Victor
created: 2026-10-23
updated: 2026-10-23
related_adrs: ["ADR-0003"]
---

# FDD-0004: Lot and setbacks

| Field | Value |
|---|---|
| **Status** | Implemented |
| **Owner** | Victor |
| **Created / Updated** | 2026-10-23 / 2026-10-23 |
| **Related ADRs** | ADR-0003 |

## 1. Summary

Let the homeowner enter the lot (*terreno*) and its setbacks (*recuos*) so the plan is drawn inside the real limits. The lot appears on the canvas as an outline with the setback lines dashed inside it and the buildable area lightly tinted. A room that crosses a setback line is outlined in red and listed as a warning in the panel. The panel also shows the lot area, the occupied area and the occupancy ratio (*taxa de ocupação*). This answers "does the house fit on the lot?", the next question after "are the rooms big enough?" (FDD-0003).

## 2. Background and current state

### 2.1 Current behaviour

There is no lot. The canvas is an infinite grid; rooms can be drawn anywhere. Project state lives in `projectStore` (`rooms`, `objects`, `dimensionLines`), is saved to JSON by `Header.tsx`, autosaved by the store's `persist`, and copied per tab by `tabsStore` (`Tab` and `syncTabData`).

### 2.2 Problem

The father knows his lot (for example 12 × 30 m, front setback 5 m, sides 1,5 m, back 3 m) but cannot see it while drawing, so he cannot tell whether the house fits or how much of the lot it uses.

### 2.3 Constraints

- All lengths are stored as integer centimetres (ADR-0003); input in metres with comma or dot.
- Saved files, autosaves and tabs without a lot must keep working.
- Containment and ratio maths are pure functions in `src/utils/`; components only render and dispatch.
- Areas are measured to wall centrelines (FDD-0003 NON-05); the occupancy ratio inherits that caveat.

## 3. Objectives and non-objectives

### 3.1 Objectives

- **OBJ-01:** The user can define a rectangular lot by width (frente) and depth (profundidade), and four setbacks: front, back, left and right.
- **OBJ-02:** The canvas shows the lot outline, the dashed setback lines, the tinted buildable area and a *Frente (rua)* label on the front edge.
- **OBJ-03:** Any room with a corner outside the buildable area is outlined in red on the canvas and named in a panel warning.
- **OBJ-04:** The panel shows lot area, buildable area, occupied area (sum of room areas) and *taxa de ocupação* as a percentage.
- **OBJ-05:** The lot can be moved by dragging its outline, snapped to the grid, so it can be placed around rooms already drawn.
- **OBJ-06:** The lot is saved with the project, survives reloads and stays with its own tab.

### 3.2 Non-objectives

- **NON-01:** Irregular (non-rectangular) lots. Most urban Brazilian lots are rectangles; irregular ones can be approximated for a sketch.
- **NON-02:** Legal limits (maximum *taxa de ocupação*, *coeficiente de aproveitamento*, *taxa de permeabilidade*). They vary by municipality; the architect checks them. The tool shows the numbers only.
- **NON-03:** Rotating the lot. The front is always the bottom edge (see Q1).
- **NON-04:** Blocking rooms from crossing a setback. The tool warns; it does not prevent (same reasoning as overlap in FDD-0002 Q2).
- **NON-05:** Several lots per project.

## 4. User experience (guide-level)

### 4.1 Interaction flow

1. With nothing selected, the panel shows a *Terreno* section with a *Definir terreno* button.
2. He clicks it. Fields appear, pre-filled with a common lot: *Frente* `12`, *Profundidade* `30`, *Recuo frontal* `5`, *Recuo de fundos* `3`, *Recuo lateral esquerdo* `1,5`, *Recuo lateral direito* `1,5` (metres). The lot appears on the canvas at the origin.
3. He edits a field (Enter or leaving the field commits; Esc restores). The canvas updates.
4. He drags the lot outline so his existing rooms sit inside it. It snaps to the grid.
5. A room that crosses a dashed line turns red, and the panel shows *Ultrapassa o recuo: Cômodo 3*.
6. The panel shows, for example: *Área do terreno* `360,00 m²`, *Área edificável* `220,50 m²`, *Área ocupada* `98,40 m²`, *Taxa de ocupação* `27,3 %`.
7. *Remover terreno* deletes the lot after a confirmation.

Invalid values (non-numeric, zero or negative size, setbacks that leave no buildable area) are flagged in red and not applied.

### 4.2 Interaction states

N/A. No new tool mode; the lot drag is a single drag like the wall drag in FDD-0002.

## 5. Technical design (reference-level)

### 5.1 Components (React)

| File | Change | Responsibility |
|---|---|---|
| `src/components/panels/PropertiesPanel/PropertiesPanel.tsx` | Modified | *Terreno* section: define/remove, six fields, figures, setback warning. Shown when nothing is selected. |
| `src/components/canvas/layers/LotLayer.tsx` | New | Lot outline, setback lines, buildable tint, front label, drag. |
| `src/components/canvas/FloorCanvas.tsx` | Modified | Render `LotLayer` below `RoomLayer`; exclude the lot outline from starting a selection box. |
| `src/components/canvas/layers/RoomLayer.tsx` | Modified | Red outline for rooms outside the buildable area. |
| `src/components/layout/Header.tsx` | Modified | Include `lot` in saved JSON and on load. |
| `src/i18n/translations.ts` | Modified | All new labels and messages. |

### 5.2 Canvas (Konva)

`LotLayer` sits between the grid and the rooms. Setback lines, the tint and the label are `listening={false}`. Only the outline's hit area listens, and it is named (like `ROOM_WALL_NAME`) so a press on it does not start a selection box. On drag end the delta is snapped to the grid and committed with `moveLot`.

### 5.3 State (Zustand)

`projectStore` gains `lot?: Lot` and three actions:

```ts
setLot: (lot: Lot) => void;        // create or replace
moveLot: (delta: { dx: number; dy: number }) => void;
removeLot: () => void;
```

`partialize`, `loadProject`, `clearProject` and `tabsStore` (`Tab`, `syncTabData`, tab switching) carry `lot` alongside `rooms`.

### 5.4 Domain logic

`src/types/lot.ts`:

```ts
/** Rectangular lot. All values in whole centimetres; front is the bottom edge. */
export interface Lot {
  origin: Point;          // top-left corner
  width: number;          // frente
  depth: number;          // profundidade
  setbacks: { front: number; back: number; left: number; right: number };
}
```

`src/utils/lot.ts` (pure):

```ts
/** Buildable rectangle inside the setbacks; throws if setbacks leave none. */
export function buildableRect(lot: Lot): Rect;

/** Rooms with at least one corner outside the buildable rectangle. */
export function roomsOutsideSetbacks(rooms: readonly Room[], lot: Lot): Room[];

/** Occupied area ÷ lot area, as a fraction (0.273 → 27,3 %). */
export function occupancyRatio(occupiedCm2: number, lot: Lot): number;

/** Validates user values before setLot; returns an error key or null. */
export function validateLot(lot: Lot): 'invalidSize' | 'noBuildableArea' | null;
```

Because the buildable area is a rectangle (convex), a room lies inside it exactly when all of its corners do. No polygon clipping is needed. A corner on the setback line counts as inside.

Length input reuses the FDD-0003 approach: a `parseLengthInput` in `src/utils/format.ts` (or next to `parseAreaInput`) accepts `1,5` and `1.5` and returns whole centimetres.

### 5.5 Persistence

`lot` is an optional top-level field in the saved JSON, the autosave and each tab. Files without it load with no lot. No version bump is needed.

### 5.6 Edge cases

| Case | Handling |
|---|---|
| No lot defined | No lot drawn, no warnings, *Terreno* section shows only *Definir terreno* |
| Setbacks larger than the lot | `validateLot` → `noBuildableArea`; value rejected and field flagged |
| Room exactly on a setback line | Inside (no warning) |
| Lot dragged over existing rooms | Warnings recompute immediately |
| No rooms | Occupied area `0,00 m²`, ratio `0,0 %` |
| Rooms overlap each other | Occupied area double-counts the overlap (overlap is allowed, FDD-0002 Q2); acceptable for a sketch |

## 6. Alternatives considered

### 6.1 Draw the lot as a polygon with the existing room tools

Handles irregular lots, but setbacks on a polygon need polygon offsetting, and "which edge is the front" needs extra UI. Rejected for this scale (NON-01).

### 6.2 Block rooms from crossing setbacks

Rejected: the father should be free to sketch, and the architect may know of exceptions (e.g. a garage allowed in the front setback). A warning is enough (NON-04).

## 7. Cross-cutting concerns

- **Undo/redo:** none exists yet (FDD-0002 §9.2); lot edits are plain store updates.
- **Canvas performance:** the containment check is O(rooms × corners), a few hundred comparisons; done in a `useMemo` on `rooms` and `lot`.
- **Keyboard and accessibility:** labelled inputs with `inputmode="decimal"`; Enter/blur commit, Esc restores.
- **Translations:** all new text in `translations.ts`.
- **PDF export:** the lot is drawn on the canvas, so the current PDF captures it. Scaled output is FDD-0005.

## 8. Verification

### 8.1 Acceptance criteria

- **AC-01:**
  - **Given** no lot
  - **When** the user clicks *Definir terreno*
  - **Then** a 12 × 30 m lot with the default setbacks appears on the canvas and in the panel
- **AC-02:**
  - **Given** a lot
  - **When** the user sets *Recuo lateral esquerdo* to `2,5` and presses Enter
  - **Then** the left setback line moves to 2,50 m from the edge and the value is stored as 250 cm
- **AC-03:**
  - **Given** a room with one corner inside the front setback
  - **When** the panel is shown
  - **Then** the room is outlined in red and named in the setback warning
- **AC-04:**
  - **Given** a 12 × 30 m lot and rooms totalling 98,40 m²
  - **When** the panel is shown
  - **Then** it shows *Área do terreno* `360,00 m²` and *Taxa de ocupação* `27,3 %`
- **AC-05:**
  - **Given** a lot
  - **When** the user drags its outline 1,03 m right
  - **Then** the lot moves 1,00 m (grid snap) and warnings recompute
- **AC-06:**
  - **Given** setbacks that leave no buildable area (e.g. left + right ≥ width)
  - **When** the value is committed
  - **Then** it is rejected, the field is flagged and the lot is unchanged
- **AC-07:**
  - **Given** a project with a lot, saved to JSON
  - **When** it is reopened, and when switching tabs and back
  - **Then** the lot is restored; a file without a lot opens with none

### 8.2 Invariants

- **INV-01:** When a lot exists, its buildable rectangle has positive width and depth.
- **INV-02:** Lot values are whole centimetres.
- **INV-03:** A room is flagged if and only if at least one corner lies strictly outside the buildable rectangle.

### 8.3 Test plan

| Tier | File | Covers |
|---|---|---|
| Unit (Vitest) | `src/utils/lot.test.ts` | `buildableRect`, `roomsOutsideSetbacks`, `occupancyRatio`, `validateLot`, length parsing — AC-02, AC-03, AC-04, AC-06, INV-01–03 |
| Unit (Vitest) | `src/stores/projectStore.test.ts` | `setLot`, `moveLot`, `removeLot` |
| Browser (Playwright) | scratchpad script | Define, edit, drag, warning colour, save/reopen, tab switch — AC-01, AC-03, AC-05, AC-07 |

### 8.4 Definition of done

- [x] `Lot` type, `src/utils/lot.ts` and tests exist and pass.
- [x] Store actions and persistence (autosave, JSON save/load, tabs) carry the lot.
- [x] `LotLayer` draws outline, setbacks, tint and front label, and can be dragged.
- [x] Rooms outside the buildable area are red and listed in the panel.
- [x] Panel shows lot area, buildable area, occupied area and *taxa de ocupação*.
- [x] All new strings are in `translations.ts`.
- [x] Checked in a real browser, including an older project file (tab switching: see 9.2, item 1).
- [x] `npm run build` and `npm test` pass.
- [x] Status updated to `Implemented` and deviations logged in 9.2.

## 9. Open questions and history

### 9.1 Open questions

- [x] **Q1 (Closed):** The front (street) is the bottom edge, marked *Frente (rua)*. Rotating the lot is out of scope (NON-03).
- [x] **Q2 (Closed):** Fields are pre-filled with 12 × 30 m, front 5 m, back 3 m, sides 1,5 m; the lot appears at once and is edited from there.
- [x] **Q3 (Closed):** Yes; the FDD-0003 centreline note appears under the lot figures.

### 9.2 History and deviations

- 2026-10-23: Draft created. Q1–Q3 closed as proposed.
- 2026-10-23: Approved by Victor; implemented. Verified with 81 Vitest tests and a browser run (Playwright driving Edge): 17 checks covering AC-01 to AC-07, Esc and reload. Deviations:
  1. **Tabs do not hold separate projects (pre-existing).** `tabsStore.syncTabData` is never called and switching tabs only changes the highlighted tab; every tab shows the same project. The lot therefore behaves exactly like rooms, and `tabsStore` was not changed. The tab part of AC-07 does not apply until tabs are made real (its own FDD).
  2. **Opened files are validated.** `parseSavedLot` ignores a missing or malformed `lot` in a JSON file instead of trusting it.
  3. **The lot can only be dragged with the Select tool,** so clicking its outline while drawing a room still draws.
  4. **Setback warning outranks selection colour:** a crossing room stays red while selected, so it is visible as the user drags it back inside.
  5. **Helpers added:** `formatPercent` and `formatLengthForInput` in `format.ts`; `LOT_OUTLINE_NAME` and `DEFAULT_LOT_CM` in constants. Percentages print as Intl gives them for pt-BR (`27,3%`, no space).
