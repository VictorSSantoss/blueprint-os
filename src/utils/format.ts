/**
 * Display formatting utilities for measurements.
 *
 * @remarks
 * All stored coordinates and dimensions are integer centimetres (ADR-0003).
 * Conversion to metres and locale-aware formatting happens exclusively here,
 * keeping the rest of the codebase free of both raw division and locale logic.
 *
 * Formatters are created once at module load; constructing them per-render
 * would add unnecessary GC pressure at 60 fps.
 */

const AREA_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const LENGTH_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a room area for display in the Brazilian Portuguese locale.
 *
 * @param cm2 - Area in square centimetres (integer).
 * @returns Formatted string, e.g. `"12,60 m²"`.
 * @example
 * formatArea(120000) // → "12,00 m²"
 * formatArea(126000) // → "12,60 m²"
 * formatArea(0)      // → "0,00 m²"
 */
export function formatArea(cm2: number): string {
  return `${AREA_FORMATTER.format(cm2 / 10000)} m²`;
}

/**
 * Formats a wall length or perimeter for display in the Brazilian Portuguese locale.
 *
 * @param cm - Length in whole centimetres (integer).
 * @returns Formatted string, e.g. `"3,45 m"`.
 * @example
 * formatLength(345) // → "3,45 m"
 * formatLength(400) // → "4,00 m"
 * formatLength(0)   // → "0,00 m"
 */
export function formatLength(cm: number): string {
  return `${LENGTH_FORMATTER.format(cm / 100)} m`;
}

const INPUT_AREA_FORMATTER = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
  useGrouping: false,
});

/**
 * Formats an area as an editable pt-BR number in m², without unit or forced decimals.
 *
 * @param cm2 - Area in square centimetres.
 * @returns Text for an input field, e.g. `"14,5"`.
 * @example
 * formatAreaForInput(145000) // → "14,5"
 * formatAreaForInput(140000) // → "14"
 */
export function formatAreaForInput(cm2: number): string {
  return INPUT_AREA_FORMATTER.format(cm2 / 10000);
}
