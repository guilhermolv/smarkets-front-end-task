import { describe, expect, it } from 'vitest';
import { toAmericanOdds, toBackStakeGbp, toDecimalOdds, toImpliedPercent, toPotGbp } from './price';

describe('Smarkets OpenAPI price conversions', () => {
  it('converts documented basis-point examples into decimal, percent and American odds', () => {
    expect(toDecimalOdds(5000)).toBe(2);
    expect(toImpliedPercent(5000)).toBe(50);
    expect(toAmericanOdds(2)).toBe(100);

    expect(toDecimalOdds(4000)).toBe(2.5);
    expect(toImpliedPercent(4000)).toBe(40);
    expect(toAmericanOdds(2.5)).toBe(150);

    expect(toDecimalOdds(6667)?.toFixed(2)).toBe('1.50');
    expect(Math.round(toAmericanOdds(toDecimalOdds(6667) ?? 0) ?? 0)).toBe(-200);
  });

  it('converts documented quantity examples into GBP stake and pot', () => {
    expect(toBackStakeGbp(100000, 5000)).toBe(5);
    expect(toPotGbp(500)).toBe(0.05);
  });
});
