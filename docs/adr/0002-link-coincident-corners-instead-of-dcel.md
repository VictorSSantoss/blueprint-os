---
id: ADR-0002
status: Accepted
date: 2026-10-23
---

# ADR-0002: Link coincident corners instead of DCEL

## Context and problem statement

floor-maker stores each `Room` as its own independent array of `Corner` objects. When two rooms share a wall, each room holds its own copy of the two endpoints of that wall. There is no structural link between them: dragging one room's corner leaves the neighbour's copy in place, creating a gap. The core feature of this project — resizing one room automatically resizes its neighbour — requires solving this.

## Decision drivers

- The fix must not require rewriting the existing `Room`, `Corner` and `Wall` types or the Zustand store structure; those are already stable and tested upstream.
- The logic must live in a pure function in `src/utils/` (rooms in → rooms out), not inside React components or Konva event handlers.
- The solution must be understandable without a computational geometry background.
- This is a small personal project; an academic-grade solution is not warranted.

## Considered options

1. **Doubly-Connected Edge List (DCEL / half-edge graph)** — rewrite the data model so each wall is a single edge shared by two faces (rooms). Moving a vertex automatically moves both rooms.
2. **Coincident corner linking** — keep the existing data model. When a corner is dragged, find every corner in every other room whose stored position is identical (same integer x, same integer y) and move them all in one atomic store update.
3. **Keep rooms independent, sync manually** — after each drag, run a spatial query to find nearby corners and nudge them. No data model change but inherently error-prone (float comparison, ordering issues).

## Decision outcome

Chosen option: **coincident corner linking**.

A DCEL would require replacing the entire `Room`/`Corner`/`Wall` schema and every piece of code that reads it — effectively discarding the upstream base. The benefit (O(1) lookups instead of O(n) iteration) is irrelevant at the scale of a residential floor plan (< 200 corners). Coincident linking achieves the same user-visible result with a single utility function and no schema change.

Option 3 is rejected because floating-point spatial queries are the exact source of drift and inconsistency the project is designed to avoid (see ADR-0003).

### Consequences

- **Good:** no schema migration; the existing `Room[]` state works unchanged.
- **Good:** the linking rule is easy to state: "if two corners have the same integer coordinates, they are the same physical point."
- **Good:** the move function is a pure transformation, fully unit-testable without a canvas.
- **Bad:** T-junctions (where a corner sits on the middle of an opposing wall, not at its endpoint) are not handled automatically. Acceptable for the MVP; a residential plan rarely needs mid-wall T-junctions, and if they arise they can be addressed in a follow-up ADR.
- **Bad:** the O(n) scan over all corners on every drag event. At residential scale (< 200 corners, 60 fps) this is under 1 ms per frame and requires no optimisation.
