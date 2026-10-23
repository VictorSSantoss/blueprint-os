import { describe, it, expect } from 'vitest';
import { makeRectRoom } from '../test/factories';
import { parseAreaInput, compareToTarget, nextRoomName, PROGRAMME_TOLERANCE } from './programme';

describe('parseAreaInput', () => {
  it('parses a whole number of m²', () => {
    expect(parseAreaInput('14')).toBe(140000);
  });

  it('[FDD-0003 / AC-02] accepts a comma as the decimal separator', () => {
    expect(parseAreaInput('14,5')).toBe(145000);
  });

  it('accepts a dot as the decimal separator and surrounding spaces', () => {
    expect(parseAreaInput(' 14.5 ')).toBe(145000);
  });

  it('rounds to whole cm²', () => {
    expect(parseAreaInput('0,00005')).toBe(1);
  });

  it.each(['', 'abc', '0', '0,0', '-3', '1.234,5', '14,5,2', '14 m²'])(
    '[FDD-0003 / INV-01 / INV-02] rejects %j',
    (input) => {
      expect(parseAreaInput(input)).toBeNull();
    }
  );
});

describe('compareToTarget', () => {
  it('[FDD-0003 / AC-01] reports a room that is too small', () => {
    const result = compareToTarget(126000, 140000);

    expect(result).toEqual({ diffCm2: -14000, withinTolerance: false });
  });

  it('[FDD-0003 / AC-03] is within tolerance at exactly 5 % over', () => {
    const target = 140000;

    const result = compareToTarget(target * (1 + PROGRAMME_TOLERANCE), target);

    expect(result.withinTolerance).toBe(true);
  });

  it('is outside tolerance just beyond 5 % under', () => {
    const result = compareToTarget(132999, 140000);

    expect(result.withinTolerance).toBe(false);
  });

  it('throws for a non-positive target', () => {
    expect(() => compareToTarget(100, 0)).toThrow();
  });
});

describe('nextRoomName', () => {
  it('starts at 1 for an empty project', () => {
    expect(nextRoomName([], 'Cômodo')).toBe('Cômodo 1');
  });

  it('[FDD-0003 / AC-06] reuses the first free number', () => {
    const rooms = [
      makeRectRoom(0, 0, 100, 100, { name: 'Cômodo 1' }),
      makeRectRoom(100, 0, 100, 100, { name: 'Cômodo 3' }),
    ];

    expect(nextRoomName(rooms, 'Cômodo')).toBe('Cômodo 2');
  });

  it('ignores rooms with other names', () => {
    const rooms = [makeRectRoom(0, 0, 100, 100, { name: 'Quarto do casal' }), makeRectRoom(0, 0, 100, 100)];

    expect(nextRoomName(rooms, 'Cômodo')).toBe('Cômodo 1');
  });
});
