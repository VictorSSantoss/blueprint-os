# BlueprintOS

A browser-based 2D floor plan editor for sketching a house layout to hand to an architect. Draw rooms, snap them wall to wall, place doors, windows and furniture, read areas in m² and print the plan. The interface is in Brazilian Portuguese and all measurements are shown in metres.

It is a small personal project, not a product: the architect handles structure, plumbing and building codes; this tool only helps reason about space.

Forked from [ahmethakanbesel/floor-maker](https://github.com/ahmethakanbesel/floor-maker). The upstream README declares MIT, but the upstream repository ships no `LICENSE` file.

## Prerequisites

- Node.js 20.19 or newer
- npm

## Quick start

```bash
npm install
npm run dev     # http://localhost:5173
```

| Command | Description |
|---|---|
| `npm run build` | Type-check and build for production |
| `npm test` | Run the Vitest suite |
| `npm run lint` | Run ESLint |

## Current features

- **Rooms:** rectangle and polygon tools with grid snapping; area and perimeter per room and in total.
- **Shared walls:** new and dragged corners snap onto existing corners within 20 cm. Dragging a shared corner or wall moves every room that touches it, and moves that would collapse or cross a room are rejected.
- **Brazilian Portuguese and metres:** `3,45 m` and `12,60 m²` everywhere; coordinates are stored as whole centimetres.
- **Object library:** doors, windows, furniture, appliances and bathroom fixtures, placed by click or drag.
- **Ruler and dimension labels.**
- **Save and load** projects as JSON; the current project also autosaves in the browser.
- **PDF export.**

Not available yet: undo/redo (the history store exists but is not wired up).

Keyboard shortcuts: `V` select, `R` draw polygon room, hold `Space` to pan, `+` / `-` zoom, `0` reset view, `Delete` remove selection, `Ctrl+D` duplicate, `Ctrl+R` rotate.

## Project layout

```text
src/
  types/        domain types (rooms, geometry, objects, project)
  utils/        pure logic with no React or Konva: geometry, linking, format, PDF export
  stores/       Zustand stores, one per domain (project, selection, tool, canvas, ...)
  components/
    canvas/     Konva stage, layers (grid, rooms, objects, interaction) and shapes
    panels/     object library and properties panel
    layout/     header, toolbar, status bar
  i18n/         every user-facing string (pt-BR, with en kept for development; ?lang=en)
  constants/    grid, zoom, wall and colour constants
docs/
  designs/      feature design documents (FDDs)
  adr/          architecture decision records
```

## Documentation

Feature design documents:

- [FDD-0001: pt-BR localisation and metre display](docs/designs/0001-pt-br-localisation-and-metre-display.md)
- [FDD-0002: Shared walls](docs/designs/0002-shared-walls.md)

Architecture decisions:

- [ADR-0001: Fork floor-maker as the base](docs/adr/0001-fork-floor-maker-as-base.md)
- [ADR-0002: Link coincident corners instead of a DCEL](docs/adr/0002-link-coincident-corners-instead-of-dcel.md)
- [ADR-0003: Store integer centimetres](docs/adr/0003-store-integer-centimetres.md)

Working rules for contributors and Claude Code are in [CLAUDE.md](CLAUDE.md).
