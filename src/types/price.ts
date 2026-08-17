export type PricePoint = {
  timestamp: string;
  price: number;
};

export type PriceHistory = Record<string, PricePoint[]>;
