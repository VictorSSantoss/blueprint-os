import { describe, it, expect } from 'vitest';
import type { Lot } from '../types';
import { makeRectRoom } from '../test/factories';
import { buildableRect, occupancyRatio, parseLengthInput, parseSavedLot, roomsOutsideSetbacks, validateLot } from './lot';

function makeLot(overrides: Partial<Lot> = {}): Lot {
  return {
    origin: { x: 0, y: 0 },
    width: 1200,
    depth: 3000,
    setbacks: { front: 500, back: 300, left: 150, right: 150 },
    ...overrides,
  };
}

describe('parseLengthInput', () => {
  it('[FDD-0004 / AC-02] accepts a comma', () => {
    expect(parseLengthInput('2,5')).toBe(250);
  });

  it('accepts zero for a side setback', () => {
    expect(parseLengthInput('0')).toBe(0);
  });

  it.each(['', 'abc', '-1', '1.234,5'])('[FDD-0004 / INV-02] rejects %j', (input) => {
    expect(parseLengthInput(input)).toBeNull();
  });
});

describe('validateLot', () => {
  it('accepts the default lot', () => {
    expect(validateLot(makeLot())).toBeNull();
  });

  it('rejects a zero width', () => {
    expect(validateLot(makeLot({ width: 0 }))).toBe('invalidSize');
  });

  it('[FDD-0004 / AC-06 / INV-01] rejects side setbacks that consume the width', () => {
    const lot = makeLot({ setbacks: { front: 500, back: 300, left: 600, right: 600 } });

    expect(validateLot(lot)).toBe('noBuildableArea');
  });

  it('[FDD-0004 / INV-01] rejects front and back setbacks that consume the depth', () => {
    const lot = makeLot({ setbacks: { front: 2000, back: 1000, left: 150, right: 150 } });

    expect(validateLot(lot)).toBe('noBuildableArea');
  });
});

describe('buildableRect', () => {
  it('insets the lot by its setbacks, with the front at the bottom', () => {
    expect(buildableRect(makeLot({ origin: { x: 100, y: 200 } }))).toEqual({
      x: 250,
      y: 500,
      width: 900,
      height: 2200,
    });
  });

  it('throws when there is no buildable area', () => {
    expect(() => buildableRect(makeLot({ width: 300 }))).toThrow();
  });
});

describe('roomsOutsideSetbacks', () => {
  // Buildable rectangle of the default lot: x 150–1050, y 300–2500.
  it('does not flag a room fully inside', () => {
    expect(roomsOutsideSetbacks([makeRectRoom(200, 400, 400, 300)], makeLot())).toEqual([]);
  });

  it('[FDD-0004 / INV-03] does not flag a room touching the setback line', () => {
    expect(roomsOutsideSetbacks([makeRectRoom(150, 300, 400, 300)], makeLot())).toEqual([]);
  });

  it('[FDD-0004 / AC-03 / INV-03] flags a room with one corner in the front setback', () => {
    const room = makeRectRoom(200, 2300, 400, 300); // bottom edge at 2600 > 2500

    expect(roomsOutsideSetbacks([room], makeLot())).toEqual([room]);
  });

  it('ignores incomplete rooms', () => {
    const room = makeRectRoom(0, 0, 100, 100, { isComplete: false });

    expect(roomsOutsideSetbacks([room], makeLot())).toEqual([]);
  });
});

describe('occupancyRatio', () => {
  it('[FDD-0004 / AC-04] divides occupied area by lot area', () => {
    // 98,40 m² on a 360 m² lot
    expect(occupancyRatio(984000, makeLot())).toBeCloseTo(0.2733, 4);
  });
});

describe('parseSavedLot', () => {
  it('[FDD-0004 / AC-07] restores a saved lot', () => {
    expect(parseSavedLot(JSON.parse(JSON.stringify(makeLot())))).toEqual(makeLot());
  });

  it.each([undefined, null, 'lot', { width: 1200 }, { ...makeLot(), width: '12' }, makeLot({ width: 200 })])(
    'ignores a missing or malformed lot (%j)',
    (value) => {
      expect(parseSavedLot(value)).toBeUndefined();
    }
  );
});
