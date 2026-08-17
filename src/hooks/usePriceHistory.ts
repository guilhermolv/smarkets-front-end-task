import { useEffect, useState } from 'react';
import { readDisplayPrice } from '../lib/quotes';
import type { QuotesResponse } from '../lib/schemas';
import type { PriceHistory } from '../types/price';

export function usePriceHistory(quotes: QuotesResponse | undefined) {
  const [priceHistory, setPriceHistory] = useState<PriceHistory>({});

  useEffect(() => {
    if (!quotes) return;

    setPriceHistory((currentHistory) => {
      let hasChanges = false;
      const nextHistory = { ...currentHistory };

      for (const quote of quotes.contracts) {
        const price = readDisplayPrice(quote);
        if (price === null) continue;

        const existingPoints = nextHistory[quote.contractId] ?? [];
        if (existingPoints.at(-1)?.timestamp === quotes.fetchedAt) continue;

        nextHistory[quote.contractId] = [...existingPoints, { timestamp: quotes.fetchedAt, price }].slice(-24);
        hasChanges = true;
      }

      return hasChanges ? nextHistory : currentHistory;
    });
  }, [quotes]);

  return priceHistory;
}
