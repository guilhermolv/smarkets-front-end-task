import type { ContractQuote, MarketSummary } from './schemas';

export function readDisplayPrice(
  quote: { bestBackPrice: number | null; bestLayPrice: number | null; lastTradedPrice: number | null } | undefined,
) {
  return quote?.bestBackPrice ?? quote?.lastTradedPrice ?? quote?.bestLayPrice ?? null;
}

export function marketHasPrice(market: MarketSummary, quotesByContractId: Map<string, ContractQuote>) {
  return market.contracts.some((contract) => readDisplayPrice(quotesByContractId.get(contract.id)) !== null);
}

export function sortMarketsPricedFirst(markets: MarketSummary[], quotesByContractId: Map<string, ContractQuote>) {
  return [...markets].sort(
    (left, right) => Number(marketHasPrice(right, quotesByContractId)) - Number(marketHasPrice(left, quotesByContractId)),
  );
}

export function snapshotPricedMarketOrder(
  markets: MarketSummary[],
  quotesByContractId: Map<string, ContractQuote>,
  quotesLoaded: boolean,
  frozenIds: string[] | null,
) {
  if (frozenIds || !quotesLoaded) return frozenIds;
  return sortMarketsPricedFirst(markets, quotesByContractId).map((market) => market.id);
}

export function applyFrozenMarketOrder(markets: MarketSummary[], frozenIds: string[] | null) {
  if (!frozenIds) return markets;

  const marketsById = new Map(markets.map((market) => [market.id, market]));
  const ordered = frozenIds.flatMap((id) => {
    const market = marketsById.get(id);
    return market ? [market] : [];
  });
  const seen = new Set(frozenIds);

  return [...ordered, ...markets.filter((market) => !seen.has(market.id))];
}
