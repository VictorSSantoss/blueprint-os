/**
 * Project file format — FDD-0007.
 *
 * @remarks
 * Version 1.1 stores every plan option. The top-level `rooms`, `objects`,
 * `dimensionLines` and `lot` repeat the active option so the file stays readable and
 * close to version 1.0, which held a single plan.
 */

import type { PlanSnapshot } from '../stores/historyStore';
import { parseSavedLot } from './lot';

export interface ProjectOption {
  name: string;
  plan: PlanSnapshot;
}

export interface ProjectFile extends Omit<PlanSnapshot, 'lot'> {
  version: '1.1';
  name: string;
  activeOption: number;
  options: ProjectOption[];
  lot?: PlanSnapshot['lot'];
}

const arrayOr = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

function planFrom(source: Record<string, unknown>): PlanSnapshot {
  return {
    rooms: arrayOr(source.rooms),
    objects: arrayOr(source.objects),
    dimensionLines: arrayOr(source.dimensionLines),
    lot: parseSavedLot(source.lot),
  };
}

/**
 * Builds the JSON object written by "Salvar projeto".
 *
 * @param name - Project (house) name.
 * @param options - Every option in tab order.
 * @param activeOption - Index of the option on screen.
 * @returns A version 1.1 project file.
 */
export function serializeProject(name: string, options: ProjectOption[], activeOption: number): ProjectFile {
  return { version: '1.1', name, activeOption, options, ...options[activeOption].plan };
}

/**
 * Reads an opened project file, which is untrusted input.
 *
 * @param json - Parsed file contents.
 * @param optionBase - Localised base name, e.g. `Opção`; a version 1.0 file becomes `Opção 1`.
 * @returns The project name, its options and the index of the option to show.
 * @throws {Error} When the content is not an object, or a 1.1 file has no valid options or active index.
 */
export function parseProjectFile(
  json: unknown,
  optionBase: string
): { name: string; options: ProjectOption[]; activeOption: number } {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    throw new Error('Project file must contain a JSON object');
  }
  const data = json as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name : '';

  if (!('options' in data)) {
    return { name, options: [{ name: `${optionBase} 1`, plan: planFrom(data) }], activeOption: 0 };
  }

  if (!Array.isArray(data.options) || data.options.length === 0) {
    throw new Error('Project file has no plan options');
  }
  const options = data.options.map((raw, i) => {
    if (typeof raw !== 'object' || raw === null) throw new Error(`Option ${i + 1} is not an object`);
    const o = raw as Record<string, unknown>;
    const plan = typeof o.plan === 'object' && o.plan !== null ? (o.plan as Record<string, unknown>) : {};
    return { name: typeof o.name === 'string' && o.name.trim() ? o.name : `${optionBase} ${i + 1}`, plan: planFrom(plan) };
  });
  const active = data.activeOption;
  if (!Number.isInteger(active) || (active as number) < 0 || (active as number) >= options.length) {
    throw new Error(`Invalid active option ${String(active)}`);
  }
  return { name, options, activeOption: active as number };
}
