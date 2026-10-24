---
id: FDD-0003
title: Room programme
status: Implemented
owner: Victor
created: 2026-10-23
updated: 2026-10-23
related_adrs: ["ADR-0003"]
---

# FDD-0003: Room programme

| Field | Value |
|---|---|
| **Status** | Implemented |
| **Owner** | Victor |
| **Created / Updated** | 2026-10-23 / 2026-10-23 |
| **Related ADRs** | ADR-0003 |

## 1. Summary

Let the homeowner write down how big each room *should* be (the *programa de necessidades*) and compare it with what is drawn. Each room gets an optional target area. The properties panel shows the target next to the actual area and how far apart they are, and the no-selection panel lists every room with its target, its actual area and the totals. This turns "is the master bedroom big enough?" into a number on screen, and gives the architect a clear list of intentions.

## 2. Background and current state

### 2.1 Current behaviour

`Room` (`src/types/rooms.ts`) has `name`, `corners`, `walls`, `fillColor` and `isComplete`; there is no target. `PropertiesPanel.tsx` shows a selected room's area and perimeter (`RoomProperties`) and, with nothing selected, room count, total area, total perimeter and object count (`RoomStatistics`). New rooms are created in `FloorCanvas.tsx` with the hardcoded English name `Room`.

### 2.2 Problem

The user knows the sizes they want ("quarto do casal com uns 14 m²") but has to keep them in mind or on paper and compare by hand. Every new room is also called "Room", so a list of rooms would be unreadable.

### 2.3 Constraints

- Areas are stored as integer square centimetres (ADR-0003); display uses `formatArea`.
- Older project files and autosaves have no target field and must still open.
- Parsing and comparison are pure functions in `src/utils/`; components only render and dispatch.
- Undo is not wired up in the app (FDD-0002 §9.2), so this feature does not promise undo.

## 3. Objectives and non-objectives

### 3.1 Objectives

- **OBJ-01:** A room can have an optional target area, entered in m² with a comma or a dot (`14`, `14,5`, `14.5`).
- **OBJ-02:** The selected room's panel shows target, actual area and the difference (`faltam 1,20 m²` / `sobram 0,80 m²`), coloured green when within tolerance and amber otherwise.
- **OBJ-03:** With nothing selected, the panel shows a *Programa de necessidades* table: one row per room (name, target, actual) and totals for target and actual area.
- **OBJ-04:** New rooms get distinct pt-BR default names: `Cômodo 1`, `Cômodo 2`, …
- **OBJ-05:** The panel states how areas are measured: drawn lines are wall centrelines, so real usable area is slightly smaller. This is shown as always-visible text, not a tooltip, so a non-technical user sees it.

### 3.2 Non-objectives

- **NON-01:** Minimum-area rules from building codes (e.g. municipal minimums for bedrooms). That is the architect's job.
- **NON-02:** Targets for width or proportions; area only.
- **NON-03:** Showing targets on the canvas. The panel is enough for now; the canvas already carries the actual area.
- **NON-04:** A separate programme list that exists before rooms are drawn. A target always belongs to a drawn room.
- **NON-05:** Wall thickness. Drawn lines are wall centrelines; areas are measured to them. Real *área útil* is slightly smaller and *área construída* slightly larger; the architect sets wall thickness.

## 4. User experience (guide-level)

### 4.1 Interaction flow

1. The user draws a room; it appears as `Cômodo 3`.
2. He selects it and renames it `Quarto do casal` in *Nome do cômodo* (existing field).
3. In the new *Área desejada (m²)* field he types `14`. The panel shows:
   - *Área desejada* `14,00 m²`
   - *Área atual* `12,60 m²`
   - `faltam 1,40 m²` in amber.
4. He drags a wall until the line reads `sobram 0,20 m²` in green.
5. He clicks empty canvas. The *Programa de necessidades* table lists every room, then *Total*: target `86,00 m²`, actual `82,35 m²`. Under the totals, in small grey text: *Áreas medidas pelo eixo das paredes. A área útil real será um pouco menor.*
6. Invalid input (`abc`, `0`, `-3`) leaves the previous target unchanged and outlines the field in red. Clearing the field removes the target.

### 4.2 Interaction states

N/A. No new tool mode; one text field on an existing panel.

## 5. Technical design (reference-level)

### 5.1 Components (React)

| File | Change | Responsibility |
|---|---|---|
| `src/components/panels/PropertiesPanel/PropertiesPanel.tsx` | Modified | `RoomProperties`: target field and comparison. `RoomStatistics`: programme table and totals. |
| `src/components/canvas/FloorCanvas.tsx` | Modified | Use `nextRoomName(rooms)` instead of the literal `Room` for both drawing tools. |
| `src/i18n/translations.ts` | Modified | New keys: `targetArea`, `actualArea`, `areaShort`, `areaOver`, `roomProgramme`, `total`, `invalidArea`, `defaultRoomName`, `areaMeasurementNote`. |

### 5.2 Canvas (Konva)

N/A. Nothing new is drawn.

### 5.3 State (Zustand)

No new action: the panel calls the existing `updateRoom(id, { targetAreaCm2 })`.

### 5.4 Domain logic

`src/types/rooms.ts`:

```ts
export interface Room {
  // ...existing fields
  /** Desired area in square centimetres; absent when the user set no target. */
  targetAreaCm2?: number;
}
```

New pure functions in `src/utils/programme.ts`:

```ts
/** Allowed gap between target and actual, as a fraction of the target. */
export const PROGRAMME_TOLERANCE = 0.05;

/** "14,5" | "14.5" | "14" → 145000 cm². Null for empty, non-numeric, zero or negative. */
export function parseAreaInput(input: string): number | null;

/** Signed gap in cm² (actual − target) and whether it is within tolerance. */
export function compareToTarget(actualCm2: number, targetCm2: number): { diffCm2: number; withinTolerance: boolean };

/** First unused "<base> N" name, e.g. "Cômodo 3". */
export function nextRoomName(rooms: readonly Room[], base: string): string;
```

`parseAreaInput` replaces one comma with a dot and rejects anything else that is not a plain number, so `1.234,5` is rejected rather than misread. The result is rounded to whole cm².

### 5.5 Persistence

`targetAreaCm2` is an optional field on `Room`, so it travels in the saved JSON and the browser autosave with no schema version change. Files without it load as rooms with no target.

### 5.6 Edge cases

| Case | Handling |
|---|---|
| Room has no target | Panel shows the empty field; programme row shows `—` for target and no difference |
| Target set, room deleted | Target goes with the room |
| Totals when some rooms have no target | Target total sums only rooms that have one; the row says so (`3 de 5 cômodos com meta`) |
| Room renamed to a duplicate name | Allowed; names are labels, not keys |
| `nextRoomName` when the user renamed `Cômodo 2` | Next free number is reused: `Cômodo 2` |

## 6. Alternatives considered

### 6.1 A separate programme list, matched to rooms by name

Closer to how architects write a programme, but it needs a matching step and breaks on renames. Rejected for this scale (NON-04).

### 6.2 Show the target on the canvas label

Useful at a glance but crowds small rooms. Deferred (NON-03).

## 7. Cross-cutting concerns

- **Undo/redo:** none exists yet; editing a target is a plain `updateRoom`.
- **Canvas performance:** N/A, no canvas change.
- **Keyboard and accessibility:** the field is a labelled `<input inputmode="decimal">`; Enter or blur commits, Esc restores the stored value.
- **Translations:** all new text goes through `translations.ts` (pt-BR and en).

## 8. Verification

### 8.1 Acceptance criteria

- **AC-01:**
  - **Given** a selected room of 12,60 m² with no target
  - **When** the user types `14` in *Área desejada* and presses Enter
  - **Then** the panel shows `14,00 m²`, `12,60 m²` and `faltam 1,40 m²` in amber
- **AC-02:**
  - **Given** a target of `14,5`
  - **When** it is committed
  - **Then** the stored value is `145000` cm² (comma accepted)
- **AC-03:**
  - **Given** a room within 5 % of its target
  - **When** it is selected
  - **Then** the difference is shown in green
- **AC-04:**
  - **Given** three rooms, two with targets
  - **When** nothing is selected
  - **Then** the programme table lists all three and the target total sums only the two
- **AC-05:**
  - **Given** a project file saved before this feature
  - **When** it is opened
  - **Then** it loads with no targets and no errors
- **AC-06:**
  - **Given** rooms `Cômodo 1` and `Cômodo 3` exist
  - **When** a new room is drawn
  - **Then** it is named `Cômodo 2`
- **AC-07:**
  - **Given** nothing is selected
  - **When** the programme table is shown
  - **Then** the wall-centreline note is visible under the totals without hovering or clicking

### 8.2 Invariants

- **INV-01:** `targetAreaCm2` is either absent or a positive integer.
- **INV-02:** Invalid input never changes the stored target.

### 8.3 Test plan

| Tier | File | Covers |
|---|---|---|
| Unit (Vitest) | `src/utils/programme.test.ts` | `parseAreaInput`, `compareToTarget`, `nextRoomName` — AC-02, AC-03, AC-06, INV-01, INV-02 |
| Browser (Playwright) | scratchpad script | Enter target, read panel, programme table, load old file — AC-01, AC-04, AC-05 |

### 8.4 Definition of done

- [x] `Room.targetAreaCm2` exists and is optional.
- [x] `src/utils/programme.ts` and its tests exist and pass.
- [x] Target field, comparison and colours work in `RoomProperties`.
- [x] Programme table with totals and the measurement note works in `RoomStatistics`.
- [x] New rooms are named `Cômodo N`.
- [x] All new strings are in `translations.ts`.
- [x] Checked in a real browser, including opening an older project file.
- [x] `npm run build` and `npm test` pass.
- [x] Status updated to `Implemented` and deviations logged in 9.2.

## 9. Open questions and history

### 9.1 Open questions

- [x] **Q1 (Closed):** Drawn lines are wall centrelines and areas are measured to them; wall thickness is not modelled (NON-05). The total is labelled *Área total* with an always-visible note explaining the measurement (OBJ-05).
- [x] **Q2 (Closed):** Green within ±5 % of the target (`PROGRAMME_TOLERANCE = 0.05`); on a 14 m² room that is ±0,70 m².
- [x] **Q3 (Closed):** Existing rooms keep their names; only new rooms are named `Cômodo N`.

### 9.2 History and deviations

- 2026-10-23: Draft created.
- 2026-10-23: Review: wall thickness rejected for now (it changes every area and needs mitre joints); Q1 closed with the centreline note (OBJ-05, AC-07). Q2 and Q3 closed as proposed.
- 2026-10-23: Approved by Victor; implemented. Verified with 52 Vitest tests and a browser run (Playwright driving Edge) covering AC-01 to AC-07, INV-02 and Esc. Deviations:
  1. **Extra translation keys:** `targetShort`, `actualShort` (table headers) and `roomsWithTarget` (the "1 de 2 cômodos com meta" line), beyond the list in 5.1.
  2. **`formatAreaForInput`** added to `src/utils/format.ts` so a stored target shows in the field as `14,5`.
  3. **Amber colour tokens** (`--color-amber`, `--color-amber-wash`) added to `src/index.css`; the theme had none.
  4. **Esc in panel fields (pre-existing bug):** the canvas's window-level Esc handler cleared the selection even while typing in a panel field, closing the panel. It now ignores keys from inputs; this also fixes the room-name field.
  5. **Shared test factory:** `makeRectRoom` reached its third copy, so it moved to `src/test/factories.ts` and the two older copies were deleted.
