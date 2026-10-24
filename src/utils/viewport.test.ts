import { describe, it, expect } from 'vitest';
import { makeRectRoom } from '../test/factories';
import { fitViewport, planBounds } from './viewport';
import { MAX_ZOOM, MIN_ZOOM } from '../constants';
import type { PlanSnapshot } from '../stores/historyStore';

const makePlan = (overrides: Partial<PlanSnapshot> = {}): PlanSnapshot => ({
  rooms: [],
  objects: [],
  dimensionLines: [],
  ...overrides,
});
const setbacks = { front: 500, back: 300, left: 150, right: 150 };

describe('planBounds', () => {
  it('is null for an empty plan', () => {
    expect(planBounds(makePlan())).toBeNull();
  });

  it('covers both the rooms and the lot', () => {
    const plan = makePlan({
      rooms: [makeRectRoom(1100, -200, 610, 820)],
      lot: { origin: { x: 0, y: 0 }, width: 1600, depth: 3000, setbacks },
    });

    const bounds = planBounds(plan);

    expect(bounds).toEqual({ x: 0, y: -200, width: 1710, height: 3200 });
  });
});

describe('fitViewport', () => {
  it('centres the area and makes it as large as the canvas allows', () => {
    const viewport = fitViewport({ x: 0, y: 0, width: 500, height: 500 }, 1080, 1080);

    expect(viewport).toEqual({ zoom: 1, offsetX: 40, offsetY: 40 });
  });

  it('fits a 16 × 30 m lot into a typical canvas by its depth', () => {
    const viewport = fitViewport({ x: 0, y: 0, width: 1600, height: 3000 }, 700, 680);

    expect(viewport.zoom).toBeCloseTo(0.1, 5);
    expect(viewport.offsetX).toBeCloseTo(350 - 800 * 2 * viewport.zoom, 5);
  });

  it('keeps the zoom inside the allowed range', () => {
    expect(fitViewport({ x: 0, y: 0, width: 1, height: 1 }, 800, 600).zoom).toBe(MAX_ZOOM);
    expect(fitViewport({ x: 0, y: 0, width: 100000, height: 100000 }, 800, 600).zoom).toBe(MIN_ZOOM);
  });
});
