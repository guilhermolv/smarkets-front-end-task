import { describe, expect, it } from 'vitest';
import { matchesCategory, parseEventCategory } from './marketData';

describe('parseEventCategory', () => {
  it('keeps supported category values and falls back to all for unknown values', () => {
    expect(parseEventCategory('football')).toBe('football');
    expect(parseEventCategory('greyhound_racing')).toBe('greyhound_racing');
    expect(parseEventCategory('does-not-exist')).toBe('all');
    expect(parseEventCategory(undefined)).toBe('all');
  });
});

describe('matchesCategory', () => {
  it('matches sports from either the Smarkets slug or event type', () => {
    expect(
      matchesCategory(
        {
          id: 'event-1',
          name: 'Arsenal vs Chelsea',
          full_slug: '/sport/football/premier-league/arsenal-chelsea',
          type: 'GENERIC',
        },
        'football',
      ),
    ).toBe(true);

    expect(
      matchesCategory(
        {
          id: 'event-2',
          name: 'Race 1',
          full_slug: null,
          type: 'horse_racing_race',
        },
        'horse_racing',
      ),
    ).toBe(true);

    expect(
      matchesCategory(
        {
          id: 'event-4',
          name: 'Greyhound race',
          full_slug: '/sport/greyhound-racing/race-1',
          type: 'GENERIC',
        },
        'greyhound_racing',
      ),
    ).toBe(true);
  });

  it('does not match unrelated categories', () => {
    expect(
      matchesCategory(
        {
          id: 'event-3',
          name: 'Election',
          full_slug: '/politics/uk/general-election',
          type: 'politics_market',
        },
        'tennis',
      ),
    ).toBe(false);
  });
});
