import type { ContractQuote, MarketSummary } from './schemas';

export function readDisplayPrice(quote: { bestBackPrice: number | null; bestLayPrice: number | null; lastTradedPrice: number | null } | undefined) {
  return quote?.bestBackPrice ?? quote?.lastTradedPrice ?? quote?.bestLayPrice ?? null;
}

export function marketHasPrice(market: MarketSummary, quotesByContractId: Map<string, ContractQuote>) {
  return market.contracts.some((contract) => readDisplayPrice(quotesByContractId.get(contract.id)) !== null);
}
