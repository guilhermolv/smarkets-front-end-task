import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { PriceButtonMode, PriceFormat } from '../types/price';

type PriceDisplayContextValue = {
  priceButtonMode: PriceButtonMode;
  priceFormat: PriceFormat;
  setPriceButtonMode: (mode: PriceButtonMode) => void;
  setPriceFormat: (format: PriceFormat) => void;
};

const PriceDisplayContext = createContext<PriceDisplayContextValue | null>(null);

export function PriceDisplayProvider({ children }: { children: ReactNode }) {
  const [priceFormat, setPriceFormat] = useState<PriceFormat>('decimal');
  const [priceButtonMode, setPriceButtonMode] = useState<PriceButtonMode>('both');
  const value = useMemo(
    () => ({
      priceButtonMode,
      priceFormat,
      setPriceButtonMode,
      setPriceFormat,
    }),
    [priceButtonMode, priceFormat],
  );

  return <PriceDisplayContext.Provider value={value}>{children}</PriceDisplayContext.Provider>;
}

export function usePriceDisplay() {
  const context = useContext(PriceDisplayContext);
  if (!context) {
    throw new Error('usePriceDisplay must be used within PriceDisplayProvider');
  }

  return context;
}
