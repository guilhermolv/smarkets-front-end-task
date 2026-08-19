import { describe, expect, it } from 'vitest';
import { bestBid, bestOffer, mapContractQuotes, mergeLastExecutedPrices, parseMarketIds, parseLastExecutedPrice } from './quoteMapping';

describe('parseMarketIds', () => {
  it('trims, drops empties and caps the homepage batch size', () => {
    expect(parseMarketIds(' a, ,b ')).toEqual(['a', 'b']);
    expect(parseMarketIds(Array.from({ length: 80 }, (_, index) => `m${index}`).join(','))).toHaveLength(72);
    expect(parseMarketIds(undefined)).toEqual([]);
  });
});

describe('bestBid and bestOffer', () => {
  it('uses the highest bid and lowest offer in basis points', () => {
    expect(bestBid([])).toBeNull();
    expect(bestOffer([])).toBeNull();
    expect(bestBid([[4000, 100], [4500, 50], { price: 4200, quantity: 10 }])).toBe(4500);
    expect(bestOffer([[5000, 100], [4800, 50], { price: 5100 }])).toBe(4800);
  });
});

describe('mergeLastExecutedPrices', () => {
  it('keeps the newest timestamp per contract', () => {
    const merged = mergeLastExecutedPrices([
      { contract_id: 'c1', last_executed_price: '4000', timestamp: '2026-08-15T09:00:00Z' },
      { contract_id: 'c1', last_executed_price: '4100', timestamp: '2026-08-15T09:05:00Z' },
      { contract_id: 'c2', last_executed_price: 'not-a-price', timestamp: null },
    ]);

    expect(merged.get('c1')).toEqual({ lastTradedPrice: 4100, lastTradedAt: '2026-08-15T09:05:00Z' });
    expect(merged.get('c2')).toEqual({ lastTradedPrice: null, lastTradedAt: null });
  });
});

describe('mapContractQuotes', () => {
  it('maps empty books and last-traded-only contracts', () => {
    const lastExecuted = mergeLastExecutedPrices([
      { contract_id: 'last-only', last_executed_price: '5000', timestamp: '2026-08-15T09:00:00Z' },
    ]);

    expect(
      mapContractQuotes(
        {
          empty: { bids: [], offers: [] },
        },
        lastExecuted,
      ),
    ).toEqual([
      {
        contractId: 'empty',
        bestBackPrice: null,
        bestLayPrice: null,
        bids: [],
        offers: [],
        lastTradedPrice: null,
        lastTradedAt: null,
      },
      {
        contractId: 'last-only',
        bestBackPrice: null,
        bestLayPrice: null,
        bids: [],
        offers: [],
        lastTradedPrice: 5000,
        lastTradedAt: '2026-08-15T09:00:00Z',
      },
    ]);
  });

  it('sorts bids descending and offers ascending', () => {
    const [quote] = mapContractQuotes(
      {
        c1: {
          bids: [[4000, 10], [4500, 20]],
          offers: [[5000, 30], [4800, 40]],
        },
      },
      new Map(),
    );

    expect(quote.bestBackPrice).toBe(4500);
    expect(quote.bestLayPrice).toBe(4800);
    expect(quote.bids.map((level) => level.price)).toEqual([4500, 4000]);
    expect(quote.offers.map((level) => level.price)).toEqual([4800, 5000]);
  });
});

describe('parseLastExecutedPrice', () => {
  it('accepts numeric strings only', () => {
    expect(parseLastExecutedPrice('5000')).toBe(5000);
    expect(parseLastExecutedPrice('0')).toBeNull();
    expect(parseLastExecutedPrice('abc')).toBeNull();
  });
});
