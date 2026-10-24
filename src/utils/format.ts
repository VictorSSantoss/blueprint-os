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

const INPUT_NUMBER_FORMATTER = new Intl.NumberFormat('pt-BR', {
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
  return INPUT_NUMBER_FORMATTER.format(cm2 / 10000);
}

/**
 * Formats a length as an editable pt-BR number in metres, without unit or forced decimals.
 *
 * @param cm - Length in whole centimetres.
 * @returns Text for an input field, e.g. `"1,5"`.
 * @example
 * formatLengthForInput(150) // → "1,5"
 */
export function formatLengthForInput(cm: number): string {
  return INPUT_NUMBER_FORMATTER.format(cm / 100);
}

const PERCENT_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Formats a fraction as a pt-BR percentage with one decimal.
 *
 * @param fraction - A ratio such as 0.273.
 * @returns Formatted string, e.g. `"27,3%"`.
 * @example
 * formatPercent(0.2733) // → "27,3%"
 */
export function formatPercent(fraction: number): string {
  return PERCENT_FORMATTER.format(fraction);
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

/**
 * Formats a timestamp as a pt-BR date and time in the browser's time zone.
 *
 * @param iso - ISO 8601 timestamp, e.g. a project's `updatedAt`.
 * @returns Formatted string, e.g. `"23/10/2026, 09:00"`.
 * @example
 * formatDateTime('2026-10-23T12:00:00Z') // → "23/10/2026, 09:00" in São Paulo
 */
export function formatDateTime(iso: string): string {
  return DATE_TIME_FORMATTER.format(new Date(iso));
}
