import { describe, expect, it } from 'vitest';
import {
  formatChartScrubLabel,
  formatChartTime,
  formatContractList,
  formatDateTime,
  formatEventType,
  formatOrderSize,
  formatPercentPrice,
  formatPrice,
  formatState,
} from './format';

describe('format helpers', () => {
  it('formats Smarkets machine names for display', () => {
    expect(formatEventType('TABLE_TENNIS_MATCH')).toBe('Table Tennis Match');
    expect(formatState('upcoming')).toBe('Upcoming');
  });

  it('summarises contract lists without overflowing cards', () => {
    expect(formatContractList([{ name: 'Home' }, { name: 'Away' }, { name: 'Draw' }, { name: 'Other' }])).toBe('Home, Away, Draw +1 more');
    expect(formatContractList([])).toBe('Contracts pending');
  });

  it('formats missing datetimes as TBC', () => {
    expect(formatDateTime(null)).toBe('TBC');
  });

  it('formats chart axis times', () => {
    expect(formatChartTime(undefined)).toBe('Latest');
    expect(formatChartTime('2026-08-15T09:02:00Z')).toMatch(/\d{1,2}:\d{2}/);
    expect(formatChartScrubLabel('2026-08-15T09:02:00Z')).toMatch(/AUG/i);
  });

  it('formats OpenAPI basis-point prices', () => {
    expect(formatPrice(null, '--')).toBe('--');
    expect(formatPrice(5000, '--')).toBe('2.00');
    expect(formatPrice(4000, '--')).toBe('2.50');
    expect(formatPrice(4000, '--', 'percent')).toBe('40.00%');
    expect(formatPrice(4000, '--', 'american')).toBe('+150');
    expect(formatPrice(6667, '--', 'american')).toBe('-200');
  });

  it('formats percent prices and order sizes for market insight views', () => {
    expect(formatPercentPrice(4000)).toBe('40.00%');
    expect(formatOrderSize(null)).toBe('--');
    expect(formatOrderSize(100000, 5000)).toBe('£5.00');
    expect(formatOrderSize(500)).toBe('£0.05');
  });
});
