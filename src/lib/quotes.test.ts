import { describe, expect, it } from 'vitest';
import { applyFrozenMarketOrder, marketHasPrice, readDisplayPrice, snapshotPricedMarketOrder, sortMarketsPricedFirst } from './quotes';
import type { ContractQuote, MarketSummary } from './schemas';

function quote(contractId: string, bestBackPrice: number | null): ContractQuote {
  return {
    contractId,
    bestBackPrice,
    bestLayPrice: null,
    bids: [],
    offers: [],
    lastTradedPrice: null,
    lastTradedAt: null,
  };
}

describe('quote helpers', () => {
  it('prefers back price, then last traded, then lay', () => {
    expect(readDisplayPrice(undefined)).toBeNull();
    expect(readDisplayPrice({ bestBackPrice: 1.5, bestLayPrice: 2.5, lastTradedPrice: 1.8 })).toBe(1.5);
    expect(readDisplayPrice({ bestBackPrice: null, bestLayPrice: 2.5, lastTradedPrice: 1.8 })).toBe(1.8);
    expect(readDisplayPrice({ bestBackPrice: null, bestLayPrice: 2.5, lastTradedPrice: null })).toBe(2.5);
  });

  it('detects whether a market has any displayable price', () => {
    const market: MarketSummary = {
      id: 'm1',
      name: 'Winner',
      state: 'open',
      contracts: [
        { id: 'c1', name: 'Home' },
        { id: 'c2', name: 'Away' },
      ],
    };

    expect(marketHasPrice(market, new Map())).toBe(false);
    expect(marketHasPrice(market, new Map([['c2', quote('c2', 2.1)]]))).toBe(true);
  });

  it('freezes priced-first order so later quotes do not reshuffle markets', () => {
    const winner: MarketSummary = {
      id: 'winner',
      name: 'Winner',
      state: 'open',
      contracts: [{ id: 'home', name: 'Home' }],
    };
    const correctScore: MarketSummary = {
      id: 'correct-score',
      name: 'Correct score',
      state: 'open',
      contracts: [{ id: 'score', name: '1-0' }],
    };
    const markets = [correctScore, winner];
    const firstQuotes = new Map([['home', quote('home', 5000)]]);
    const laterQuotes = new Map([
      ['home', quote('home', 5000)],
      ['score', quote('score', 4000)],
    ]);

    const frozenIds = snapshotPricedMarketOrder(markets, firstQuotes, true, null);
    expect(sortMarketsPricedFirst(markets, firstQuotes).map((market) => market.id)).toEqual(['winner', 'correct-score']);
    expect(frozenIds).toEqual(['winner', 'correct-score']);
    expect(snapshotPricedMarketOrder(markets, laterQuotes, true, frozenIds)).toEqual(['winner', 'correct-score']);
    expect(applyFrozenMarketOrder(markets, frozenIds).map((market) => market.id)).toEqual(['winner', 'correct-score']);
    expect(sortMarketsPricedFirst(markets, laterQuotes).map((market) => market.id)).toEqual(['correct-score', 'winner']);
  });
});
