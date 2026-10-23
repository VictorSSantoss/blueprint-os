---
id: FDD-0006
title: Undo and redo
status: Implemented
owner: Victor
created: 2026-10-23
updated: 2026-10-23
related_adrs: []
---

# FDD-0006: Undo and redo

| Field | Value |
|---|---|
| **Status** | Implemented |
| **Owner** | Victor |
| **Created / Updated** | 2026-10-23 / 2026-10-23 |
| **Related ADRs** | — |

*FDD-0005 stays reserved for the architect export, as planned in CLAUDE.md.*

## 1. Summary

Make *Desfazer* and *Refazer* work. Every change to the plan (rooms, walls, objects, lot, targets, names) can be undone with Ctrl+Z (⌘Z on Mac) or the header button, and redone with Ctrl+Shift+Z / Ctrl+Y or the other button. Rapid bursts, such as typing a room name or resizing a piece of furniture, undo as one step. This lets the father experiment without fear of breaking his plan.

## 2. Background and current state

### 2.1 Current behaviour

`src/stores/historyStore.ts` already implements a snapshot stack (`past`, `future`, `pushState`, `undo`, `redo`, max 50), but nothing calls it. The header's undo/redo buttons (`Header.tsx`) have no `onClick` and are always disabled. There are no undo shortcuts. The README and FDD-0002 §9.2 record this.

### 2.2 Problem

A wrong drag, an accidental *Excluir* or a bad lot value cannot be reverted. For a non-technical user this makes the tool feel fragile.

### 2.3 Constraints

- Project state is immutable: every change is a new `rooms` / `objects` / `dimensionLines` / `lot` reference from one `set()` call (FDD-0002 INV-03).
- Some interactions write to the store continuously: object resize on every mouse move, the room-name and other panel text fields on every keystroke.
- History lives in memory only; it is not saved with the project.

## 3. Objectives and non-objectives

### 3.1 Objectives

- **OBJ-01:** Every change to `rooms`, `objects`, `dimensionLines` or `lot` is recorded, with no change to the individual store actions.
- **OBJ-02:** Changes less than `HISTORY_COALESCE_MS` (500 ms) after the previous recorded change join the same undo step, so a burst of typing or a resize is one step.
- **OBJ-03:** Ctrl/⌘+Z undoes; Ctrl/⌘+Shift+Z and Ctrl+Y redo; the header buttons do the same and are enabled only when there is something to undo or redo.
- **OBJ-04:** Undo and redo are not themselves recorded, and a new change after an undo clears the redo stack.
- **OBJ-05:** Inside a text field, the shortcuts keep the browser's own text undo (the hook already ignores inputs).
- **OBJ-06:** Dragging furniture saves its new position. Today the object moves on screen but the store is never updated, so the move is lost on reload or save and could not be undone.

### 3.2 Non-objectives

- **NON-01:** Undo for view state (zoom, pan, grid, selection, tool mode). Only the plan itself.
- **NON-02:** Undo for the project name. It is set rarely and lives outside the plan snapshot.
- **NON-03:** Persisting history across reloads.
- **NON-04:** A visible history list. Two buttons are enough.

## 4. User experience (guide-level)

### 4.1 Interaction flow

1. The father deletes a room by mistake and presses Ctrl+Z (or clicks the ↶ button). The room comes back.
2. He presses Ctrl+Shift+Z (or ↷). It is deleted again.
3. He types *Quarto do casal* in the room name, then presses Ctrl+Z outside the field. The whole name change is undone in one step.
4. He drags a shared wall (FDD-0002). One Ctrl+Z puts both rooms back.
5. After undoing, he makes a new change; ↷ becomes disabled.
6. Opening a project or starting a new one is also one step and can be undone.

### 4.2 Interaction states

N/A. No new tool mode.

## 5. Technical design (reference-level)

### 5.1 Components (React)

| File | Change | Responsibility |
|---|---|---|
| `src/components/layout/Header.tsx` | Modified | Wire the buttons to `undo` / `redo`; enable from `canUndo` / `canRedo`. |
| `src/App.tsx` | Modified | Register the shortcuts. |
| `src/components/canvas/layers/ObjectLayer.tsx` | Modified | Commit the dragged object's position on drag end (OBJ-06). |

### 5.2 Canvas (Konva)

N/A.

### 5.3 State (Zustand)

`src/stores/historyStore.ts`: snapshots gain `lot`. Recording is done by one subscriber, not by each action:

```ts
// src/stores/history.ts — started once from main.tsx
useProjectStore.subscribe((state, prev) => {
  if (isRestoring) return;                                  // undo/redo writes are not recorded
  if (unchanged(state, prev)) return;                       // name, view state, etc.
  if (now - lastRecordedAt < HISTORY_COALESCE_MS) return;   // same burst: the earlier snapshot already holds the "before" state
  pushState(snapshotOf(prev));
  lastRecordedAt = now;
});
```

`undo()` pushes the current snapshot to `future` and restores the previous one through `useProjectStore.setState`, with `isRestoring` set for that write. `redo()` is the mirror. Restoring also resets `lastRecordedAt`, so the next real change starts a new step.

### 5.4 Domain logic

`unchanged(state, prev)` compares the four plan references (`rooms`, `objects`, `dimensionLines`, `lot`) with `===`. That works because every action creates new references. It is a pure function in `src/stores/history.ts` with unit tests.

### 5.5 Persistence

None. History is in memory and starts empty on each load.

### 5.6 Edge cases

| Case | Handling |
|---|---|
| Undo removes a selected room | The panel already falls back to the statistics view when the selected id no longer exists |
| Two distinct actions within 500 ms | Merged into one step; acceptable for a hand-driven tool |
| More than 50 steps | Oldest dropped (existing `MAX_HISTORY`) |
| Ctrl+Z while typing in a field | Browser text undo; plan history untouched |
| Undo right after loading a file | Restores the previous project's plan |

## 6. Alternatives considered

### 6.1 Call `pushState` inside every store action

Explicit, but touches about fifteen actions, is easy to forget for new ones, and still needs coalescing for keystrokes and resize. Rejected.

### 6.2 Zundo (Zustand undo middleware)

A ready-made library, but it adds a dependency for about 40 lines of code, which the dependency rule asks us to avoid. The existing `historyStore` already does most of the work.

## 7. Cross-cutting concerns

- **Performance:** a snapshot is four array/object references, not a deep copy (state is immutable), so 50 steps cost almost nothing.
- **Keyboard:** Ctrl and ⌘ are treated alike by the existing hook. Ctrl+R (rotate) and the browser's own shortcuts are unaffected.
- **Translations:** button titles already use `undo` / `redo`.

## 8. Verification

### 8.1 Acceptance criteria

- **AC-01:**
  - **Given** a project with two rooms
  - **When** the user deletes one and presses Ctrl+Z
  - **Then** the room is back with the same corners and name
- **AC-02:**
  - **Given** an undone change
  - **When** the user presses Ctrl+Shift+Z
  - **Then** the change is applied again
- **AC-03:**
  - **Given** two linked rooms
  - **When** the user drags their shared wall and presses Ctrl+Z once
  - **Then** both rooms return to their previous shapes (FDD-0002 INV-03)
- **AC-04:**
  - **Given** a room named *Cômodo 1*
  - **When** the user types a new name quickly and undoes once outside the field
  - **Then** the name is *Cômodo 1* again
- **AC-05:**
  - **Given** an undone change
  - **When** the user makes a new change
  - **Then** redo is no longer available
- **AC-06:**
  - **Given** nothing to undo
  - **When** the header is shown
  - **Then** the undo button is disabled; after any change it is enabled
- **AC-07:**
  - **Given** a piece of furniture
  - **When** the user drags it and presses Ctrl+Z, then Ctrl+Shift+Z, then reloads the page
  - **Then** Ctrl+Z puts it back, redo moves it again, and after the reload it is still at the dragged position (history itself does not survive a reload, NON-03)

### 8.2 Invariants

- **INV-01:** Undo followed by redo returns exactly the same plan references.
- **INV-02:** Undo/redo never add entries to `past` on their own.

### 8.3 Test plan

| Tier | File | Covers |
|---|---|---|
| Unit (Vitest) | `src/stores/history.test.ts` | Recording, coalescing (fake timers), undo/redo, redo cleared, INV-01, INV-02 |
| Browser (Playwright) | scratchpad script | AC-01 to AC-06 with real keys and buttons |

### 8.4 Definition of done

- [x] Subscriber records plan changes with coalescing; `lot` included in snapshots.
- [x] Undo/redo restore without recording themselves.
- [x] Header buttons and shortcuts work and reflect `canUndo` / `canRedo`.
- [x] Dragged furniture keeps its position after reload (OBJ-06).
- [x] Unit tests and browser checks pass.
- [x] README and FDD-0002 §4.1 updated (undo now exists).
- [x] `npm run build` and `npm test` pass.
- [x] Status updated to `Implemented` and deviations logged in 9.2.

## 9. Open questions and history

### 9.1 Open questions

- [x] **Q1 (Closed):** 500 ms.

### 9.2 History and deviations

- 2026-10-23: Draft created.
- 2026-10-23: Furniture drag fix added (OBJ-06, AC-07) after confirming in the browser that dragged objects revert on reload. Q1 closed. Approved by Victor.
- 2026-10-23: Implemented. Verified with 91 Vitest tests and a browser run (Playwright driving Edge): 19 checks covering AC-01 to AC-07 with real keys and buttons, plus the earlier FDD-0002/0003/0004 browser suites. Deviations:
  1. **Coalescing is measured from the previous change, not the previous recorded one.** A continuous burst (typing, resizing) longer than 500 ms stays one step; with the drafted rule it would split every 500 ms.
  2. **`historyStore` rewritten.** Its `undo` expected the caller to push onto the redo stack but offered no way to do so; it now takes the current plan and manages both stacks itself. Snapshots no longer carry a timestamp.
  3. **AC-07 corrected during implementation:** it asked for Ctrl+Z after a reload, which NON-03 rules out. It now checks undo/redo of the drag and, separately, that the dragged position survives a reload.
  4. **Room labels ignore clicks (pre-existing).** The room's name and area text caught clicks in the middle of a room, so clicking there did not select it. The label group is now `listening={false}`, as CLAUDE.md asks for non-interactive shapes.
