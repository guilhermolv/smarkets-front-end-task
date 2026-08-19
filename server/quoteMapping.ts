export const quoteMarketLimit = 72;

export type QuoteLevel =
  | [number, number]
  | {
      price: number;
      quantity?: number;
    };

export type LastExecutedPrice = {
  contract_id: string;
  last_executed_price: string;
  timestamp: string | null;
};

export type ContractBook = {
  bids?: QuoteLevel[];
  offers?: QuoteLevel[];
};

export function parseMarketIds(input: unknown, limit = quoteMarketLimit) {
  if (typeof input !== 'string') return [];

  return input
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, limit);
}

export function readLevelPrice(level: QuoteLevel) {
  return Array.isArray(level) ? level[0] : level.price;
}

export function readLevelQuantity(level: QuoteLevel) {
  return Array.isArray(level) ? level[1] : (level.quantity ?? null);
}

export function mapLevel(level: QuoteLevel) {
  return {
    price: readLevelPrice(level),
    quantity: readLevelQuantity(level),
  };
}

export function bestBid(levels: QuoteLevel[]) {
  if (levels.length === 0) return null;
  return Math.max(...levels.map(readLevelPrice));
}

export function bestOffer(levels: QuoteLevel[]) {
  if (levels.length === 0) return null;
  return Math.min(...levels.map(readLevelPrice));
}

export function parseLastExecutedPrice(price: string) {
  const parsed = Number(price);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isNewerTimestamp(next: string | null, current: string | null) {
  if (!next) return current === null;
  if (!current) return true;

  const nextTime = Date.parse(next);
  const currentTime = Date.parse(current);
  if (!Number.isFinite(nextTime)) return false;
  if (!Number.isFinite(currentTime)) return true;
  return nextTime >= currentTime;
}

export function mergeLastExecutedPrices(entries: LastExecutedPrice[]) {
  const lastExecutedByContractId = new Map<string, { lastTradedPrice: number | null; lastTradedAt: string | null }>();

  for (const entry of entries) {
    const existing = lastExecutedByContractId.get(entry.contract_id);
    if (existing && !isNewerTimestamp(entry.timestamp, existing.lastTradedAt)) continue;

    lastExecutedByContractId.set(entry.contract_id, {
      lastTradedPrice: parseLastExecutedPrice(entry.last_executed_price),
      lastTradedAt: entry.timestamp,
    });
  }

  return lastExecutedByContractId;
}

export function mapContractQuotes(
  quotesByContractId: Record<string, ContractBook | undefined>,
  lastExecutedByContractId: Map<string, { lastTradedPrice: number | null; lastTradedAt: string | null }>,
) {
  const contractIds = new Set([...Object.keys(quotesByContractId), ...lastExecutedByContractId.keys()]);

  return [...contractIds].map((contractId) => {
    const book = quotesByContractId[contractId];
    const lastExecuted = lastExecutedByContractId.get(contractId);
    const bids = book?.bids ?? [];
    const offers = book?.offers ?? [];

    return {
      contractId,
      bestBackPrice: book ? bestBid(bids) : null,
      bestLayPrice: book ? bestOffer(offers) : null,
      bids: book ? [...bids].map(mapLevel).sort((left, right) => right.price - left.price) : [],
      offers: book ? [...offers].map(mapLevel).sort((left, right) => left.price - right.price) : [],
      lastTradedPrice: lastExecuted?.lastTradedPrice ?? null,
      lastTradedAt: lastExecuted?.lastTradedAt ?? null,
    };
  });
}
