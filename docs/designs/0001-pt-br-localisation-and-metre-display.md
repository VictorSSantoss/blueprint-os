---
id: FDD-0001
title: pt-BR localisation and metre display
status: Implemented
owner: Victor
created: 2026-10-23
updated: 2026-10-23
implemented: 2026-10-23
related_adrs: ["ADR-0003"]
---

# FDD-0001: pt-BR localisation and metre display

| Field | Value |
|---|---|
| **Status** | Implemented |
| **Owner** | Victor |
| **Created / Updated** | 2026-10-23 / 2026-10-23 |
| **Related ADRs** | ADR-0003 |

## 1. Summary

Add Brazilian Portuguese as the default language and replace raw `.toFixed(2)` number formatting with `Intl.NumberFormat('pt-BR')` so that all areas and lengths display in the correct Brazilian decimal format (comma as separator: `12,60 m²`, `3,45 m`). This is the minimum required for Victor's father to use the application comfortably.

## 2. Background and current state

### 2.1 Current behaviour

`src/i18n/translations.ts` defines `Language = 'en' | 'tr'` and ships ~184 string keys in English and Turkish. `settingsStore.ts` auto-detects Turkish from the browser language and falls back to English. There is no Portuguese path.

Area and length values are already converted from centimetres to metres in `PropertiesPanel.tsx` and `StatusBar.tsx` (÷10000 for area, ÷100 for length), but formatted with plain `.toFixed(2)`, producing English-locale decimals like `12.60 m²`.

### 2.2 Problem

The father's browser is configured for pt-BR. The app shows English strings and English-locale numbers. Both are wrong.

### 2.3 Constraints

- Stored unit is always cm integers (ADR-0003). Display conversion stays in the presentation layer.
- The 184 existing `en` key names are the interface contract between the store and components; key names must not change.
- `settingsStore` persists to `localStorage` under the key `'floor-maker-settings'`. Renaming the app requires also renaming this key so stale cached English settings are not picked up.

## 3. Objectives and non-objectives

### 3.1 Objectives

- **OBJ-01**: The app loads in pt-BR by default on any browser.
- **OBJ-02**: All 184 UI strings have a pt-BR translation.
- **OBJ-03**: Every area display uses `Intl.NumberFormat('pt-BR')` producing `X,XX m²`.
- **OBJ-04**: Every length display uses `Intl.NumberFormat('pt-BR')` producing `X,XX m`.

### 3.2 Non-objectives

- **NON-01**: Furniture object dimension inputs (width/depth/height in cm) remain in centimetres. The father draws rooms by clicking on the canvas; he does not type furniture sizes.
- **NON-02**: Accepting a comma as a decimal separator in numeric inputs. No room-dimension text inputs exist yet; this is deferred to FDD-0003.
- **NON-03**: A language-switching UI. The language selector is hidden; pt-BR is the only language the father uses. The `en` locale is kept in the codebase for developer readability.

## 4. User experience (guide-level)

### 4.1 Interaction flow

No new interaction. The change is invisible to the user: they open the app and all text is already in Portuguese with Brazilian-formatted numbers.

The language dropdown in the settings panel is hidden. If a developer needs to switch to English they can do so via `?lang=en` in the URL (the existing URL parameter mechanism in `settingsStore.ts` is preserved).

### 4.2 Interaction states

N/A — this feature has no new tool mode or multi-step interaction.

## 5. Technical design (reference-level)

### 5.1 Components (React)

| File | Change | Responsibility |
|---|---|---|
| `src/components/layout/StatusBar.tsx` | Modify | Replace `totalArea.toFixed(2)` with `formatArea(totalAreaCm2)` |
| `src/components/panels/PropertiesPanel/PropertiesPanel.tsx` | Modify | Replace all `.toFixed(2)` area/length calls with `formatArea` / `formatLength` |
| `src/components/layout/Header.tsx` | Modify | Hide the language selector (conditional render on `false` or remove) |

### 5.2 Canvas (Konva)

N/A — dimension labels on the canvas are rendered via `src/components/canvas/layers/` and read from the same store values. They will be updated in a later pass if needed; wall label formatting is not a blocker for this feature.

### 5.3 State (Zustand)

`src/stores/settingsStore.ts`:
- Update `detectLanguage()` to return `'pt-BR'` by default (check for `pt` prefix before checking for `tr`; fall back to `'pt-BR'` instead of `'en'`).
- Change the `persist` storage key from `'floor-maker-settings'` to `'blueprint-os-settings'` to avoid stale cached language values.
- Update `Language` type import (see 5.4).

### 5.4 Domain logic

**`src/i18n/translations.ts`**
- Change `Language = 'en' | 'tr'` to `Language = 'en' | 'pt-BR'`.
- Remove the `tr` translation object entirely.
- Add a `'pt-BR'` translation object with all 184 keys translated. Use standard Brazilian architectural vocabulary where applicable (see CLAUDE.md §Language).

Key pt-BR translations:

| Key | pt-BR value |
|---|---|
| `appName` | `BlueprintOS` |
| `untitledProject` | `Projeto sem título` |
| `select` | `Selecionar` |
| `drawPolygon` | `Polígono` |
| `drawRectangle` | `Retângulo` |
| `door` | `Porta` |
| `window` | `Janela` |
| `roomName` | `Nome do cômodo` |
| `editRoom` | `Editar cômodo` |
| `deleteRoom` | `Excluir cômodo` |
| `totalArea` | `Área total` |
| `totalPerimeter` | `Perímetro total` |
| `newProject` | `Novo projeto` |
| `openProject` | `Abrir projeto` |
| `saveProject` | `Salvar projeto` |
| `export` | `Exportar` |
| `settings` | `Configurações` |
| `showGrid` | `Mostrar grade` |
| `language` | `Idioma` |
| `rooms` | `Cômodos` |
| `bathroom` | `Banheiro` |
| `bedroom` | `Quarto` |
| `kitchen` | `Cozinha` |
| `livingRoom` | `Sala de estar` |

*(The full 184-key translation goes directly in the implementation; the table above shows the most important terms.)*

**`src/utils/format.ts`** (new file)

A pure utility with no React or Konva imports. Centralises all measurement display so the format is changed in one place.

```ts
const AREA_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const LENGTH_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a room area for display.
 *
 * @param cm2 - Area in square centimetres (integer).
 * @returns Formatted string, e.g. "12,60 m²".
 */
export function formatArea(cm2: number): string {
  return `${AREA_FORMATTER.format(cm2 / 10000)} m²`;
}

/**
 * Formats a wall length or perimeter for display.
 *
 * @param cm - Length in centimetres (integer).
 * @returns Formatted string, e.g. "3,45 m".
 */
export function formatLength(cm: number): string {
  return `${LENGTH_FORMATTER.format(cm / 100)} m`;
}
```

### 5.5 Persistence

No project JSON schema change. `settingsStore` persist key renamed: `'floor-maker-settings'` → `'blueprint-os-settings'`. Existing saved projects are unaffected; only the language preference in `localStorage` is reset on first load after this change (the new default — pt-BR — is the right value anyway).

### 5.6 Edge cases

| Case | Handling |
|---|---|
| Browser cached `'floor-maker-settings'` with `language: 'en'` | Ignored — new persist key means the store starts fresh and `detectLanguage()` returns `'pt-BR'`. |
| Browser cached `'floor-maker-settings'` with `language: 'tr'` | Same as above — key mismatch clears it. |
| `?lang=en` in URL | `detectLanguage()` still reads the URL param first; developer can force English for testing. |
| Area of 0 (incomplete room) | `formatArea(0)` → `"0,00 m²"` — correct. |

## 6. Alternatives considered

### 6.1 Keep `tr` translations alongside `pt-BR`

- **Why rejected:** Turkish adds 184 strings of maintenance weight the project will never need. The father does not read Turkish.

### 6.2 Use a third-party i18n library (i18next, react-intl)

- **Why rejected:** The existing hand-rolled `t(key)` function in `settingsStore` is sufficient for 184 static strings. Adding a library for this would violate the dependency discipline rule.

## 7. Cross-cutting concerns

- **Undo/redo:** N/A — language and formatting are display-only; they are not stored in the project history.
- **Canvas performance:** N/A — `Intl.NumberFormat` instances are created once at module load (not per render).
- **Keyboard and accessibility:** N/A.
- **Translations:** This entire feature is a translation update.

## 8. Verification

### 8.1 Acceptance criteria

- **AC-01:**
  - **Given** the app is opened in a browser with no prior `blueprint-os-settings` in localStorage
  - **When** the page loads
  - **Then** the UI language is pt-BR (app name shows "BlueprintOS", toolbar shows "Selecionar", "Polígono", "Retângulo")

- **AC-02:**
  - **Given** a completed rectangular room of 400 × 300 cm
  - **When** the room is selected and the properties panel is open
  - **Then** the area displays as `"12,00 m²"` and the perimeter as `"14,00 m"` (comma decimal separator)

- **AC-03:**
  - **Given** the same room
  - **When** the status bar is visible
  - **Then** the total area in the status bar also shows `"12,00 m²"`

- **AC-04:**
  - **Given** the URL contains `?lang=en`
  - **When** the page loads
  - **Then** the UI shows English strings (developer escape hatch works)

### 8.2 Invariants

- **INV-01:** `formatArea` and `formatLength` never produce a dot as the decimal separator (always comma for pt-BR).
- **INV-02:** No hardcoded UI string exists in any `.tsx` component file outside `src/i18n/translations.ts`.

### 8.3 Test plan

| Tier | File | Covers |
|---|---|---|
| Unit (Vitest) | `src/utils/format.test.ts` | `formatArea(120000)` → `"12,00 m²"`, `formatLength(345)` → `"3,45 m"`, `formatArea(0)` → `"0,00 m²"` — AC-02, INV-01 |
| Manual (browser) | — | Open `http://localhost:5173`, check toolbar, properties panel, status bar for pt-BR text and comma decimals — AC-01, AC-02, AC-03 |

### 8.4 Definition of done

- [x] `Language` type is `'en' | 'pt-BR'`; `tr` is removed.
- [x] All 184 keys have a pt-BR translation; no `t(key)` call falls through to the raw key string.
- [x] `formatArea` and `formatLength` are used in every place a measurement is displayed; no `.toFixed(2)` remains for area or length values.
- [x] Language selector is hidden in the UI.
- [x] Persist key is `'blueprint-os-settings'`.
- [x] `src/utils/format.test.ts` exists and covers AC-02 and INV-01.
- [x] `npm run build` passes with no new errors.
- [x] `npm test` passes (8/8).
- [x] Status is updated to `Implemented` and any deviations are logged in 9.2.

## 9. Open questions and history

### 9.1 Open questions

- [x] **Q1 (Closed):** Grid-size selector labels (`1 cm / 5 cm / 10 cm`) are identical in both locales — no change needed.

### 9.2 History and deviations

- 2026-10-23: Draft created.
- 2026-10-23: Approved by Victor.
- 2026-10-23: Implemented. Two deviation notes: (1) `exportPdf.ts` had Turkish locale comparisons — fixed to `'en'`/`'pt-BR'`. (2) Two new translation keys added (`pdfExportSuccess`, `pdfExportError`) to eliminate hardcoded toast strings in `Header.tsx`.
- 2026-10-23: Correction. The "no `.toFixed(2)` remains" DoD item had been ticked without checking the canvas. Room and wall labels on the canvas, the ruler, the drawing previews and the PDF footer still printed dots or centimetres. They now use `formatArea` / `formatLength`, which makes the DoD item true.
