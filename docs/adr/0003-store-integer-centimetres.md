---
id: ADR-0003
status: Accepted
date: 2026-10-23
---

# ADR-0003: Store integer centimetres

## Context and problem statement

Every `Point`, `Corner` and wall measurement in the data model needs a stored unit. The chosen unit affects precision, float-drift risk, display formatting and the correctness of the coincident-corner linking rule in ADR-0002 (which relies on exact coordinate equality).

## Decision drivers

- Coordinate equality must be exact (no float comparison) to make ADR-0002's linking rule reliable.
- 1 cm precision is sufficient for a base plan handed to an architect; sub-centimetre detail is irrelevant at this stage.
- The upstream codebase already uses a centimetre scale: `PIXELS_PER_CM = 2` in `src/constants/index.ts` and wall thickness in cm in `src/types/rooms.ts`.
- The display unit is metres (pt-BR format); conversion happens only in the render layer.

## Considered options

1. **Float pixels** — store screen pixels directly. Zoom and pan would mutate stored coordinates, causing drift.
2. **Float millimetres** — 1 mm precision, but float arithmetic accumulates rounding errors over repeated drag events.
3. **Integer millimetres** — exact equality, high precision. No upstream basis; would require migrating all constants and schemas.
4. **Integer centimetres** — exact equality, sufficient precision, matches upstream constants and types without migration.

## Decision outcome

Chosen option: **integer centimetres**.

Options 1 and 2 are eliminated because float comparison cannot serve as a reliable equality test for the coincident-linking rule. Between integer mm and integer cm, centimetres require no migration: the upstream `PIXELS_PER_CM` constant, the `wallThickness` default of `15` (cm), and the `MIN_WALL_LENGTH` of `10` (cm) are already in centimetres. Adopting mm would mean changing every constant and every saved project schema for a precision gain the use case does not need.

### Consequences

- **Good:** coordinate equality is exact — two corners are coincident if and only if `a.x === b.x && a.y === b.y`.
- **Good:** no float drift from drag events; geometry written to the store is always `Math.round()`ed.
- **Good:** zero schema migration from upstream.
- **Bad:** 1 cm is the minimum resolvable movement. A user cannot place a wall at 3.5 cm. Acceptable: architects work in 5–10 cm increments for this type of plan.
- **Bad:** display requires a conversion (÷ 100) to metres. Isolated to the render and input layers; the store never sees metres.
