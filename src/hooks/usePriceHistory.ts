import { useState } from 'react';
import { sortPricePoints } from '../lib/priceTrend';
import { readDisplayPrice } from '../lib/quotes';
import type { QuotesResponse } from '../lib/schemas';
import type { PriceHistory } from '../types/price';

function nextPriceHistory(currentHistory: PriceHistory, quotes: QuotesResponse) {
  let hasChanges = false;
  const nextHistory = { ...currentHistory };

  for (const quote of quotes.contracts) {
    const price = readDisplayPrice(quote);
    if (price === null) continue;

    const existingPoints = nextHistory[quote.contractId] ?? [];
    if (existingPoints.at(-1)?.timestamp === quotes.fetchedAt) continue;

    nextHistory[quote.contractId] = sortPricePoints([...existingPoints, { timestamp: quotes.fetchedAt, price }]).slice(-24);
    hasChanges = true;
  }

  return hasChanges ? nextHistory : currentHistory;
}

export function usePriceHistory(quotes: QuotesResponse | undefined) {
  const [priceHistory, setPriceHistory] = useState<PriceHistory>({});
  const [seenFetchedAt, setSeenFetchedAt] = useState<string | null>(null);

  if (quotes && quotes.fetchedAt !== seenFetchedAt) {
    setSeenFetchedAt(quotes.fetchedAt);
    setPriceHistory((currentHistory) => nextPriceHistory(currentHistory, quotes));
  }

  return priceHistory;
}
