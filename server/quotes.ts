import { z } from 'zod';
import { smarketsClient } from './smarketsClient';

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

function parseMarketIds(input: unknown) {
  if (typeof input !== 'string') return [];

  return input
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function readLevelPrice(level: z.infer<typeof quoteLevelSchema>) {
  if (Array.isArray(level)) return level[0];
  return level.price;
}

function readLevelQuantity(level: z.infer<typeof quoteLevelSchema>) {
  if (Array.isArray(level)) return level[1];
  return level.quantity ?? null;
}

function mapLevel(level: z.infer<typeof quoteLevelSchema>) {
  return {
    price: readLevelPrice(level),
    quantity: readLevelQuantity(level),
  };
}

function bestBid(levels: Array<z.infer<typeof quoteLevelSchema>>) {
  if (levels.length === 0) return null;
  return Math.max(...levels.map(readLevelPrice));
}

function bestOffer(levels: Array<z.infer<typeof quoteLevelSchema>>) {
  if (levels.length === 0) return null;
  return Math.min(...levels.map(readLevelPrice));
}

function parseLastExecutedPrice(price: string) {
  const parsed = Number(price);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function fetchMarketQuotes(input: unknown, sessionToken?: string) {
  const marketIds = parseMarketIds(input).slice(0, 24);

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
  const lastExecutedByContractId = new Map(
    Object.values(lastExecutedResponse.last_executed_prices)
      .flat()
      .map((price) => [
        price.contract_id,
        {
          lastTradedPrice: parseLastExecutedPrice(price.last_executed_price),
          lastTradedAt: price.timestamp,
        },
      ]),
  );
  const contractIds = new Set([...Object.keys(quotesResponse), ...lastExecutedByContractId.keys()]);

  return {
    contracts: [...contractIds].map((contractId) => {
      const book = quotesResponse[contractId];
      const lastExecuted = lastExecutedByContractId.get(contractId);

      return {
        contractId,
        bestBackPrice: book ? bestBid(book.bids ?? []) : null,
        bestLayPrice: book ? bestOffer(book.offers ?? []) : null,
        bids: book ? [...(book.bids ?? [])].map(mapLevel).sort((left, right) => right.price - left.price) : [],
        offers: book ? [...(book.offers ?? [])].map(mapLevel).sort((left, right) => left.price - right.price) : [],
        lastTradedPrice: lastExecuted?.lastTradedPrice ?? null,
        lastTradedAt: lastExecuted?.lastTradedAt ?? null,
      };
    }),
    fetchedAt: new Date().toISOString(),
  };
}
