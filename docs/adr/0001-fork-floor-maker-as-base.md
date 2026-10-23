---
id: ADR-0001
status: Accepted
date: 2026-10-23
---

# ADR-0001: Fork floor-maker as base

## Context and problem statement

Building a 2D floor plan editor requires a working canvas with room drawing, drag-and-drop, snap-to-grid, area calculation and PDF export. Writing all of that from scratch would consume most of the available project time before any domain-specific features (shared walls, room programme, lot outline) could be added. An existing open-source base would eliminate that cost if it matched the target stack.

## Decision drivers

- Stack must match: React 19, TypeScript, Tailwind CSS v4, Zustand, Konva (react-konva), Vite.
- Room drawing and PDF export must already work so the first session can focus on domain features.
- Small codebase — easy to read and modify without understanding a large framework.
- Minimal scope, delivered quickly: this is a personal tool, not a product.

## Considered options

1. **Build from scratch** using the stack above.
2. **Fork `ahmethakanbesel/floor-maker`** — React 19, TypeScript, Tailwind v4, Zustand 5, react-konva, Vite, jsPDF. Rooms, area calculation, furniture library, PDF export, undo/redo and i18n already implemented.
3. **Fork `fedepaj/arcada-planner`** — React, TypeScript, Zustand, Konva. Wall-node focused; handles multiple floors.

## Decision outcome

Chosen option: **fork floor-maker**.

It is the only option whose stack matches exactly (including Tailwind v4 and Vite 7). The features it already has — room drawing, Shoelace area, PDF export, undo/redo, i18n scaffolding — cover everything except the three domain features this project adds. arcada-planner lacks Tailwind and jsPDF and is less actively maintained.

### Consequences

- **Good:** room drawing, area calculation, PDF export, undo/redo and i18n (with an en/tr baseline to extend) are available from day one.
- **Good:** i18n infrastructure exists; adding pt-BR is a translation entry, not an architecture task.
- **Bad:** the repo has no LICENSE file despite the README stating MIT. Acceptable for private family use; credit the upstream in the README.
- **Bad:** upstream uses Bun; the local machine has only npm. All scripts are rewritten to plain `vite` / `tsc` invocations — a one-time change.
- **Bad:** rooms are stored as independent polygon geometries with no shared-wall awareness. Addressed by ADR-0002.
