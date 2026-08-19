import { describe, expect, it } from 'vitest';
import { plotValue, toAmericanOdds, toBackStakeGbp, toDecimalOdds, toImpliedPercent, toPotGbp } from './price';

describe('Smarkets OpenAPI price conversions', () => {
  it('converts even-money 5000bp to 2.00 / 50% / +100', () => {
    expect(toDecimalOdds(5000)).toBe(2);
    expect(toImpliedPercent(5000)).toBe(50);
    expect(toAmericanOdds(2)).toBe(100);
    expect(plotValue(5000, 'decimal')).toBe(2);
    expect(plotValue(5000, 'percent')).toBe(50);
    expect(plotValue(5000, 'american')).toBe(100);
  });

  it('converts 4000bp to 2.50 / 40% / +150', () => {
    expect(toDecimalOdds(4000)).toBe(2.5);
    expect(toImpliedPercent(4000)).toBe(40);
    expect(toAmericanOdds(2.5)).toBe(150);
  });

  it('converts ~6667bp to about 1.50 decimal and -200 American', () => {
    expect(toDecimalOdds(6667)?.toFixed(2)).toBe('1.50');
    expect(toImpliedPercent(6667)?.toFixed(2)).toBe('66.67');
    expect(Math.round(toAmericanOdds(toDecimalOdds(6667) ?? 0) ?? 0)).toBe(-200);
  });

  it('converts OpenAPI stake and pot examples', () => {
    expect(toBackStakeGbp(100000, 5000)).toBe(5);
    expect(toPotGbp(500)).toBe(0.05);
  });

  it('rejects non-positive prices', () => {
    expect(toDecimalOdds(0)).toBeNull();
    expect(toAmericanOdds(1)).toBeNull();
    expect(toBackStakeGbp(100, 0)).toBeNull();
  });
});
