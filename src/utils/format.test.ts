import { describe, it, expect } from 'vitest';
import { formatArea, formatLength } from './format';

describe('formatArea', () => {
  it('[FDD-0001 / AC-02] formats a 4×3 m room correctly', () => {
    // 400 cm × 300 cm = 120 000 cm²
    const result = formatArea(120000);

    expect(result).toBe('12,00 m²');
  });

  it('[FDD-0001 / INV-01] uses a comma, not a dot, as the decimal separator', () => {
    const result = formatArea(126000);

    expect(result).toContain(',');
    expect(result).not.toContain('.');
  });

  it('formats zero area', () => {
    const result = formatArea(0);

    expect(result).toBe('0,00 m²');
  });

  it('formats a fractional m² correctly', () => {
    // 126 000 cm² = 12.6 m²
    const result = formatArea(126000);

    expect(result).toBe('12,60 m²');
  });
});

describe('formatLength', () => {
  it('[FDD-0001 / AC-02] formats a 4 m wall correctly', () => {
    const result = formatLength(400);

    expect(result).toBe('4,00 m');
  });

  it('[FDD-0001 / INV-01] uses a comma, not a dot, as the decimal separator', () => {
    const result = formatLength(345);

    expect(result).toContain(',');
    expect(result).not.toContain('.');
  });

  it('formats zero length', () => {
    const result = formatLength(0);

    expect(result).toBe('0,00 m');
  });

  it('formats a sub-metre length correctly', () => {
    // 345 cm = 3.45 m
    const result = formatLength(345);

    expect(result).toBe('3,45 m');
  });
});
