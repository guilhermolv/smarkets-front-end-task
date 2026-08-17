import { describe, expect, it } from 'vitest';
import { marketHasPrice, readDisplayPrice } from './quotes';
import type { MarketSummary } from './schemas';

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
    expect(
      marketHasPrice(
        market,
        new Map([
          [
            'c2',
            {
              contractId: 'c2',
              bestBackPrice: 2.1,
              bestLayPrice: null,
              bids: [],
              offers: [],
              lastTradedPrice: null,
              lastTradedAt: null,
            },
          ],
        ]),
      ),
    ).toBe(true);
  });
});
