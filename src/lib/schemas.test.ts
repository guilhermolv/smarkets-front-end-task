import { describe, expect, it } from 'vitest';
import { healthSchema, quotesResponseSchema } from './schemas';

describe('healthSchema', () => {
  it('accepts the proxy health response shape', () => {
    expect(
      healthSchema.parse({
        status: 'ok',
        service: 'smarkets-proxy',
        smarketsBaseUrl: 'https://api.smarkets.com/v3',
      }),
    ).toEqual({
      status: 'ok',
      service: 'smarkets-proxy',
      smarketsBaseUrl: 'https://api.smarkets.com/v3',
    });
  });
});

describe('quotesResponseSchema', () => {
  it('accepts quote rows with last-traded fallback fields', () => {
    expect(
      quotesResponseSchema.parse({
        contracts: [
          {
            contractId: 'contract-1',
            bestBackPrice: null,
            bestLayPrice: 2.5,
            bids: [],
            offers: [{ price: 2.5, quantity: 120 }],
            lastTradedPrice: 2.4,
            lastTradedAt: '2026-08-15T09:00:00Z',
          },
        ],
        fetchedAt: '2026-08-15T09:00:01Z',
      }),
    ).toEqual({
      contracts: [
          {
            contractId: 'contract-1',
            bestBackPrice: null,
            bestLayPrice: 2.5,
            bids: [],
            offers: [{ price: 2.5, quantity: 120 }],
            lastTradedPrice: 2.4,
            lastTradedAt: '2026-08-15T09:00:00Z',
        },
      ],
      fetchedAt: '2026-08-15T09:00:01Z',
    });
  });
});
