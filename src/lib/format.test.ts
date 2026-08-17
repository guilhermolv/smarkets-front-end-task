import { describe, expect, it } from 'vitest';
import { formatContractList, formatDateTime, formatEventType, formatPrice, formatState } from './format';

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
  });
});
