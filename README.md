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
| `npx vercel dev` | Run the app together with the cloud API |

### Cloud projects setup

The editor works without any of this; cloud saving needs it.

1. Copy `.env.example` to `.env.local` and fill it in (Neon console → *Connect* and *Settings → Better Auth*). Never commit `.env.local`.
2. Run [`db/schema.sql`](db/schema.sql) once in the Neon SQL Editor.
3. In Neon *Settings → Better Auth*, add the site's domain under *Domains* and keep Google enabled.
4. Set the same four variables in Vercel → *Settings → Environment Variables*.

| Variable | Where it is used |
|---|---|
| `DATABASE_URL` | API only — Neon pooled connection string |
| `NEON_AUTH_JWKS_URL` | API only — verifies sign-in tokens |
| `ALLOWED_EMAILS` | API only — comma-separated emails that may use the cloud |
| `VITE_NEON_AUTH_URL` | Browser — Neon Auth URL; when unset the cloud buttons are hidden |

## Current features

- **Rooms:** rectangle and polygon tools with grid snapping; area and perimeter per room and in total.
- **Shared walls:** new and dragged corners snap onto existing corners within 20 cm. Dragging a shared corner or wall moves every room that touches it, and moves that would collapse or cross a room are rejected.
- **Brazilian Portuguese and metres:** `3,45 m` and `12,60 m²` everywhere; coordinates are stored as whole centimetres.
- **Object library:** doors, windows, furniture, appliances and bathroom fixtures, placed by click or drag.
- **Ruler and dimension labels.**
- **Save and load** projects as JSON (every option in one file); the current project also autosaves in the browser.
- **Cloud projects:** *Entrar com Google* saves the project to the cloud a couple of seconds after each change, and *Meus projetos* opens it on any computer. Only emails on an allow-list can use it.
- **Room programme:** target area per room, compared with the drawn area, and a *Programa de necessidades* table.
- **Lot and setbacks:** lot outline with setback lines, a warning for rooms that cross them, and the *taxa de ocupação*.
- **Undo and redo** for every change to the plan.
- **Plan options in tabs:** *Opção 1*, *Opção 2*, … each hold an alternative plan; duplicate an option to try a variant. All options are saved in the project file.
- **PDF export.**

Keyboard shortcuts: `V` select, `R` draw polygon room, hold `Space` to pan, `+` / `-` zoom, `0` reset view, `Delete` remove selection, `Ctrl+D` duplicate, `Ctrl+R` rotate, `Ctrl+Z` undo, `Ctrl+Shift+Z` or `Ctrl+Y` redo (`⌘` instead of `Ctrl` on Mac).

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
  lib/          Neon Auth client
api/            Vercel functions for cloud projects; _lib/ holds the shared request checks
db/             database schema
docs/
  designs/      feature design documents (FDDs)
  adr/          architecture decision records
```

## Documentation

Feature design documents:

- [FDD-0001: pt-BR localisation and metre display](docs/designs/0001-pt-br-localisation-and-metre-display.md)
- [FDD-0002: Shared walls](docs/designs/0002-shared-walls.md)
- [FDD-0003: Room programme](docs/designs/0003-room-programme.md)
- [FDD-0004: Lot and setbacks](docs/designs/0004-lot-and-setbacks.md)
- [FDD-0006: Undo and redo](docs/designs/0006-undo-redo.md)
- [FDD-0007: Plan options in tabs](docs/designs/0007-plan-options-in-tabs.md)
- [FDD-0008: Cloud projects](docs/designs/0008-cloud-projects.md)

Architecture decisions:

- [ADR-0001: Fork floor-maker as the base](docs/adr/0001-fork-floor-maker-as-base.md)
- [ADR-0002: Link coincident corners instead of a DCEL](docs/adr/0002-link-coincident-corners-instead-of-dcel.md)
- [ADR-0003: Store integer centimetres](docs/adr/0003-store-integer-centimetres.md)
- [ADR-0004: Store projects in Neon behind an API](docs/adr/0004-store-projects-in-neon-behind-an-api.md)

Working rules for contributors and Claude Code are in [CLAUDE.md](CLAUDE.md).
