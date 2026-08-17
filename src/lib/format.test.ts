import { describe, expect, it } from 'vitest';
import { formatContractList, formatDateTime, formatEventType, formatOrderSize, formatPercentPrice, formatPrice, formatState } from './format';

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

  it('formats missing and scaled prices', () => {
    expect(formatPrice(null, '--')).toBe('--');
    expect(formatPrice(25000, '--')).toBe('2.50');
    expect(formatPrice(2.5, '--')).toBe('2.50');
    expect(formatPrice(2.5, '--', 'percent')).toBe('40.00%');
    expect(formatPrice(1.5, '--', 'american')).toBe('-200');
    expect(formatPrice(2.5, '--', 'american')).toBe('+150');
  });

  it('formats percent prices and order sizes for market insight views', () => {
    expect(formatPercentPrice(2.5)).toBe('40.00%');
    expect(formatOrderSize(null)).toBe('--');
    expect(formatOrderSize(12)).toBe('£12');
  });
});
