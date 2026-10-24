---
id: FDD-0007
title: Plan options in tabs
status: Implemented
owner: Victor
created: 2026-10-23
updated: 2026-10-23
related_adrs: []
---

# FDD-0007: Plan options in tabs

| Field | Value |
|---|---|
| **Status** | Implemented |
| **Owner** | Victor |
| **Created / Updated** | 2026-10-23 / 2026-10-23 |
| **Related ADRs** | — |

## 1. Summary

Make the tab bar work, with each tab holding one *option* (alternative) of the same house: `Opção 1`, `Opção 2`, … The user can duplicate an option to try a variant ("what if the kitchen is bigger?"), switch between options to compare, rename and close them. Each option has its own rooms, furniture, dimension lines and lot. All options are saved in the project file, so they can take every alternative to the architect.

## 2. Background and current state

### 2.1 Current behaviour

`src/stores/tabsStore.ts` defines tabs with their own `rooms`, `objects` and `dimensionLines`, but nothing ever copies the plan in or out (`syncTabData` is never called). Switching tabs only changes the highlight; every tab shows the same plan (FDD-0004 §9.2). Fresh installs show only a *Nova aba* button, and new tabs are named `Cômodo`. The lot (FDD-0004) is not part of a tab.

### 2.2 Problem

The tabs look like a feature but do nothing, which is confusing. Meanwhile the user has a real need they could serve: comparing alternative layouts without overwriting the one they have.

### 2.3 Constraints

- `projectStore` stays the single source of truth for the *active* plan; every existing feature reads it, and undo (FDD-0006) records it.
- Older saved files (one plan, no options) must still open.
- Opened files are untrusted input and are validated.

## 3. Objectives and non-objectives

### 3.1 Objectives

- **OBJ-01:** There is always at least one tab. A fresh or upgraded install shows `Opção 1` holding the current plan.
- **OBJ-02:** Switching tabs stores the current plan in its tab and loads the other tab's plan (rooms, objects, dimension lines, lot).
- **OBJ-03:** *+* creates an empty option named with the next free number; *Duplicar* copies the active option into a new tab.
- **OBJ-04:** Tabs can be renamed (double-click, as today) and closed; the last tab cannot be closed, and closing a non-empty option asks for confirmation.
- **OBJ-05:** *Salvar projeto* writes all options and the active one into the file; *Abrir projeto* restores them. A file without options opens as a single `Opção 1`.
- **OBJ-06:** *Novo projeto* resets to a single empty `Opção 1`.
- **OBJ-07:** Switching tabs clears undo history and the selection, so an undo can never move a plan from one option into another.

### 3.2 Non-objectives

- **NON-01:** Side-by-side comparison of two options on one screen.
- **NON-02:** A separate project name per option. The project (the house) has one name; options have tab names.
- **NON-03:** Undo history kept per option.
- **NON-04:** Exporting all options to one PDF. The PDF exports the active option (FDD-0005 may revisit this).
- **NON-05:** Reordering tabs by drag.

## 4. User experience (guide-level)

### 4.1 Interaction flow

1. The user opens the app and sees one tab, *Opção 1*, with their plan.
2. He clicks *Duplicar* (copy icon on the active tab). *Opção 2* appears, identical, and becomes active.
3. In *Opção 2* he enlarges the kitchen. *Opção 1* is untouched; he clicks it to compare, then back.
4. He double-clicks *Opção 2* and renames it *Cozinha maior*.
5. *+* creates an empty *Opção 3* for a completely different idea.
6. He closes *Opção 3*; it has rooms, so the app asks *Fechar esta opção? Ela será perdida.* first.
7. *Salvar projeto* downloads one file with all options. Opening it later restores the tabs and the option he was on.

### 4.2 Interaction states

N/A. No new tool mode.

## 5. Technical design (reference-level)

### 5.1 Components (React)

| File | Change | Responsibility |
|---|---|---|
| `src/components/layout/TabBar.tsx` | Modified | Switch, create, duplicate, close with confirmation; no close button on the last tab. |
| `src/components/layout/Header.tsx` | Modified | Save/open through `projectFile.ts`; *Novo projeto* resets the tabs. |
| `src/main.tsx` | Modified | Ensure the first tab exists at startup. |
| `src/i18n/translations.ts` | Modified | `defaultOptionName`, `duplicateTab`, `confirmCloseOption`. |

### 5.2 Canvas (Konva)

N/A.

### 5.3 State (Zustand)

`tabsStore` becomes the keeper of the *inactive* options; the active option lives in `projectStore`.

```ts
interface Tab {
  id: string;
  name: string;
  plan: PlanSnapshot;   // rooms, objects, dimensionLines, lot (type from FDD-0006)
}
```

Switching is one function in `src/stores/tabs.ts`, so the order of operations lives in one place:

```
switchTab(targetId):
  1. tabs[active].plan = current projectStore plan
  2. projectStore.setState(tabs[target].plan)
  3. activeTabId = targetId
  4. clear selection and undo history   (OBJ-07)
```

`duplicateTab`, `createTab` and `closeTab` are built on the same steps. `ensureFirstTab()` runs at startup: when there is no active tab it creates *Opção 1* around the current plan. That also covers tabs left over from the old version, which held no plan.

### 5.4 Domain logic

`src/utils/projectFile.ts` (pure):

```ts
export interface ProjectFile {
  version: '1.1';
  name: string;
  activeOption: number;
  options: { name: string; plan: PlanSnapshot }[];
}

/** Builds the JSON written by "Salvar projeto". */
export function serializeProject(name: string, options: ProjectFile['options'], activeOption: number): ProjectFile;

/**
 * Reads an opened file. Accepts version 1.1 (options) and the older single-plan
 * format, which becomes one option. Throws a descriptive Error for anything else.
 */
export function parseProjectFile(json: unknown, defaultOptionName: string): Omit<ProjectFile, 'version'>;
```

For version 1.1 files the top-level `rooms`, `objects`, `dimensionLines` and `lot` also hold the active option, so the file still reads naturally for a person looking at it.

Default names reuse `nextRoomName` from FDD-0003 with base `Opção` (it only needs `name`).

### 5.5 Persistence

- **Autosave:** `projectStore` keeps the active plan (unchanged); `tabsStore` keeps the tab list, the inactive plans and `activeTabId` (its persist key is unchanged).
- **File:** version `1.1` as above. Version `1.0` files load as one option.
- **Upgrade:** old tabs without a `plan` are discarded by `ensureFirstTab`, which recreates *Opção 1* from the current plan, so nothing the user drew is lost.

### 5.6 Edge cases

| Case | Handling |
|---|---|
| Close the active tab | Switch to the neighbouring tab first, then remove |
| Close the last tab | Close button hidden |
| Duplicate | Deep copy of the plan, so editing one option never changes the other |
| Undo right after switching | Nothing to undo (history cleared) |
| File with zero options or a bad `activeOption` | `parseProjectFile` throws; the existing *Falha ao carregar* toast shows |
| Very many options | No limit; tabs scroll horizontally (existing CSS) |

## 6. Alternatives considered

### 6.1 Remove the tabs

The smallest change, and honest. Rejected because comparing alternatives is a real need for someone planning a house, and the UI already exists.

### 6.2 Tabs as separate projects (different houses)

What the upstream code seems to have aimed at. Rejected: the user plans one house, and separate projects are already handled by saving and opening files.

## 7. Cross-cutting concerns

- **Undo/redo:** history is per session and cleared on switch (OBJ-07, NON-03).
- **Performance:** switching swaps references; duplication deep-copies one plan (`structuredClone`), which is trivial at this size.
- **Keyboard:** no new shortcuts.
- **Translations:** new strings in `translations.ts`.

## 8. Verification

### 8.1 Acceptance criteria

- **AC-01:**
  - **Given** a fresh browser
  - **When** the app opens
  - **Then** one tab *Opção 1* exists and holds the plan
- **AC-02:**
  - **Given** *Opção 1* with two rooms
  - **When** the user clicks *Duplicar*, moves a wall in *Opção 2*, then clicks *Opção 1*
  - **Then** *Opção 1* still has the original wall, and *Opção 2* keeps the moved one
- **AC-03:**
  - **Given** two options
  - **When** the user switches and presses Ctrl+Z
  - **Then** nothing changes
- **AC-04:**
  - **Given** an option with rooms
  - **When** the user closes it
  - **Then** a confirmation appears; the last remaining tab has no close button
- **AC-05:**
  - **Given** three options with *Opção 2* active
  - **When** the project is saved and opened again
  - **Then** the three options return with *Opção 2* active
- **AC-06:**
  - **Given** a file saved before this feature
  - **When** it is opened
  - **Then** it appears as one option *Opção 1* with its plan
- **AC-07:**
  - **Given** two options with different plans
  - **When** the page is reloaded
  - **Then** both options and the active tab are restored

### 8.2 Invariants

- **INV-01:** There is always exactly one active tab, and it exists in the tab list.
- **INV-02:** Editing one option never changes another option's plan.

### 8.3 Test plan

| Tier | File | Covers |
|---|---|---|
| Unit (Vitest) | `src/utils/projectFile.test.ts` | Serialize/parse round trip, 1.0 files, malformed files — AC-05, AC-06 |
| Unit (Vitest) | `src/stores/tabs.test.ts` | Switch, duplicate independence, close, history cleared — AC-02, AC-03, INV-01, INV-02 |
| Browser (Playwright) | scratchpad script | AC-01 to AC-07 with real clicks, files and reloads |

### 8.4 Definition of done

- [x] Tabs hold and swap plans, including the lot.
- [x] Create, duplicate, rename and close work; the last tab cannot be closed.
- [x] Save/open handles options and older files.
- [x] Undo history and selection clear on switch.
- [x] Unit tests and browser checks pass.
- [x] README updated; FDD-0004 §9.2 item 1 marked resolved.
- [x] `npm run build` and `npm test` pass.
- [x] Status updated to `Implemented` and deviations logged in 9.2.

## 9. Open questions and history

### 9.1 Open questions

- [x] **Q1 (Closed):** *+* creates an empty option; a separate *Duplicar* button copies the active one.
- [x] **Q2 (Closed):** Tabs are named *Opção N*.

### 9.2 History and deviations

- 2026-10-23: Draft created. Q1 and Q2 closed as proposed.
- 2026-10-23: Approved by Victor; implemented. Verified with 110 Vitest tests and a browser run (Playwright driving Edge): 19 checks covering AC-01 to AC-07, plus the earlier FDD-0002/0003/0004/0006 browser suites. Deviations:
  1. **New options take the first free number.** Section 5.4 reuses `nextRoomName`, so after *Opção 2* is renamed, *+* creates *Opção 2* again rather than *Opção 3* as the walkthrough in 4.1 assumed.
  2. **Opening a file and *Novo projeto* clear undo history** (they replace every option, so undo could only half-restore them). This changes FDD-0006 §4.1 step 6.
  3. **`tabsStore` reduced to raw state;** all operations live in `src/stores/tabs.ts`. `projectStore.loadProject` lost its last caller and was removed.
  4. **`resetHistory()` added to `stores/history.ts`,** so the first change after a switch is its own undo step instead of being merged into the switch.
  5. **`parseProjectFile` takes the base name** (`Opção`) rather than a full default name, so unnamed options in a file become `Opção 1`, `Opção 2`, …
