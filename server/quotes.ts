import { smarketsClient } from './smarketsClient';
import {
  mapContractQuotes,
  mergeLastExecutedPrices,
  parseMarketIds,
  type ContractBook,
} from './quoteMapping';
import { z } from 'zod';

const quoteLevelSchema = z.union([
  z.tuple([z.number(), z.number()]),
  z
    .object({
      price: z.number(),
      quantity: z.number().optional(),
    })
    .passthrough(),
]);

const contractBookSchema = z
  .object({
    bids: z.array(quoteLevelSchema).default([]),
    offers: z.array(quoteLevelSchema).default([]),
  })
  .passthrough();

const smarketsQuotesResponseSchema = z.record(contractBookSchema);

const lastExecutedPriceSchema = z
  .object({
    contract_id: z.string(),
    last_executed_price: z.string(),
    timestamp: z.string().nullable(),
  })
  .passthrough();

const smarketsLastExecutedPricesResponseSchema = z.object({
  last_executed_prices: z.record(z.array(lastExecutedPriceSchema)),
});

function joinIds(ids: string[]) {
  return ids.map(encodeURIComponent).join(',');
}

export async function fetchMarketQuotes(input: unknown, sessionToken?: string) {
  const marketIds = parseMarketIds(input);

  if (marketIds.length === 0) {
    return { contracts: [], fetchedAt: new Date().toISOString() };
  }

  const [quotesResponse, lastExecutedResponse] = await Promise.all([
    smarketsClient.request({
      path: `/v3/markets/${joinIds(marketIds)}/quotes/`,
      sessionToken,
      schema: smarketsQuotesResponseSchema,
    }),
    smarketsClient.request({
      path: `/v3/markets/${joinIds(marketIds)}/last_executed_prices/`,
      sessionToken,
      schema: smarketsLastExecutedPricesResponseSchema,
    }),
  ]);

  return {
    contracts: mapContractQuotes(
      quotesResponse as Record<string, ContractBook | undefined>,
      mergeLastExecutedPrices(Object.values(lastExecutedResponse.last_executed_prices).flat()),
    ),
    fetchedAt: new Date().toISOString(),
  };
}
