export type PricePoint = {
  timestamp: string;
  price: number;
};

export type PriceHistory = Record<string, PricePoint[]>;

export type PriceFormat = 'decimal' | 'percent' | 'american';

export type PriceButtonMode = 'buy' | 'sell' | 'both';
