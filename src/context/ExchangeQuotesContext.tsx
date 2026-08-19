import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ContractQuote } from '../lib/schemas';
import type { PriceHistory } from '../types/price';

type ExchangeQuotesContextValue = {
  priceHistory: PriceHistory;
  quotesByContractId: Map<string, ContractQuote>;
  quotesLoaded: boolean;
};

const ExchangeQuotesContext = createContext<ExchangeQuotesContextValue | null>(null);

type ExchangeQuotesProviderProps = ExchangeQuotesContextValue & {
  children: ReactNode;
};

export function ExchangeQuotesProvider({ children, priceHistory, quotesByContractId, quotesLoaded }: ExchangeQuotesProviderProps) {
  const value = useMemo(() => ({ priceHistory, quotesByContractId, quotesLoaded }), [priceHistory, quotesByContractId, quotesLoaded]);

  return <ExchangeQuotesContext.Provider value={value}>{children}</ExchangeQuotesContext.Provider>;
}

export function useExchangeQuotes() {
  const context = useContext(ExchangeQuotesContext);
  if (!context) {
    throw new Error('useExchangeQuotes must be used within ExchangeQuotesProvider');
  }

  return context;
}
