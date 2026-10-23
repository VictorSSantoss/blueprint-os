import { describe, it, expect } from 'vitest';
import { makeRectRoom } from '../test/factories';
import { parseProjectFile, serializeProject } from './projectFile';

const lot = { origin: { x: 0, y: 0 }, width: 1200, depth: 3000, setbacks: { front: 500, back: 300, left: 150, right: 150 } };
const planA = { rooms: [makeRectRoom(0, 0, 400, 300)], objects: [], dimensionLines: [], lot };
const planB = { rooms: [makeRectRoom(0, 0, 500, 300)], objects: [], dimensionLines: [], lot: undefined };

describe('serializeProject / parseProjectFile', () => {
  it('[FDD-0007 / AC-05] round-trips every option and the active one', () => {
    const options = [
      { name: 'Opção 1', plan: planA },
      { name: 'Cozinha maior', plan: planB },
    ];

    const file = JSON.parse(JSON.stringify(serializeProject('Casa', options, 1)));
    const parsed = parseProjectFile(file, 'Opção');

    expect(parsed).toEqual({ name: 'Casa', options, activeOption: 1 });
  });

  it('repeats the active option at the top level', () => {
    const file = serializeProject('Casa', [{ name: 'Opção 1', plan: planA }], 0);

    expect(file.rooms).toBe(planA.rooms);
    expect(file.version).toBe('1.1');
  });

  it('[FDD-0007 / AC-06] opens a version 1.0 file as one option', () => {
    const old = { version: '1.0', name: 'Casa', rooms: planA.rooms, objects: [], dimensionLines: [] };

    const parsed = parseProjectFile(old, 'Opção');

    expect(parsed.options).toEqual([{ name: 'Opção 1', plan: { ...planA, lot: undefined } }]);
    expect(parsed.activeOption).toBe(0);
  });

  it.each([
    ['not an object', 'hello'],
    ['an array', []],
    ['empty options', { options: [], activeOption: 0 }],
    ['active index out of range', { options: [{ name: 'A', plan: {} }], activeOption: 3 }],
    ['an option that is not an object', { options: [42], activeOption: 0 }],
  ])('rejects a file with %s', (_label, json) => {
    expect(() => parseProjectFile(json, 'Opção')).toThrow();
  });

  it('drops a malformed lot inside an option instead of trusting it', () => {
    const json = { options: [{ name: 'A', plan: { rooms: [], lot: { width: 'big' } } }], activeOption: 0 };

    expect(parseProjectFile(json, 'Opção').options[0].plan.lot).toBeUndefined();
  });
});
