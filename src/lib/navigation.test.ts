import { describe, expect, it } from 'vitest';
import { exchangePath, readCategoryFromSearch, readEventIdFromPath } from './navigation';

describe('exchange navigation', () => {
  it('reads event ids from the path', () => {
    expect(readEventIdFromPath('/events/abc%20123')).toBe('abc 123');
    expect(readEventIdFromPath('/')).toBeNull();
  });

  it('reads supported categories from the query string', () => {
    expect(readCategoryFromSearch('?category=football')).toBe('football');
    expect(readCategoryFromSearch('?category=nope')).toBe('all');
    expect(readCategoryFromSearch('')).toBe('all');
  });

  it('keeps category on both homepage and event URLs', () => {
    expect(exchangePath(null, 'all')).toBe('/');
    expect(exchangePath(null, 'tennis')).toBe('/?category=tennis');
    expect(exchangePath('42', 'tennis')).toBe('/events/42?category=tennis');
  });
});
