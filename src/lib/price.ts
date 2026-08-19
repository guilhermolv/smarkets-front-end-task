import type { PriceFormat } from '../types/price';

/**
 * Smarkets quote and order prices are percentage basis points.
 * Example from the OpenAPI: 5000 = 50% implied probability = 2.00 decimal odds.
 * Decimal odds = 10000 / price.
 */
export function toDecimalOdds(priceBp: number) {
  if (!Number.isFinite(priceBp) || priceBp <= 0) return null;
  return 10000 / priceBp;
}

export function toImpliedPercent(priceBp: number) {
  if (!Number.isFinite(priceBp) || priceBp <= 0) return null;
  return priceBp / 100;
}

export function toAmericanOdds(decimalOdds: number) {
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) return null;
  if (decimalOdds >= 2) return (decimalOdds - 1) * 100;
  return -100 / (decimalOdds - 1);
}

export function plotValue(priceBp: number, format: PriceFormat) {
  if (format === 'percent') return toImpliedPercent(priceBp);
  if (format === 'american') {
    const decimalOdds = toDecimalOdds(priceBp);
    return decimalOdds === null ? null : toAmericanOdds(decimalOdds);
  }
  return toDecimalOdds(priceBp);
}

/**
 * Quantity is 1/100 of a UK penny. Back stake in GBP = quantity * price / 100000000.
 * OpenAPI example: 100000 * 5000 / 100000000 = £5.
 */
export function toBackStakeGbp(quantity: number, priceBp: number) {
  if (!Number.isFinite(quantity) || !Number.isFinite(priceBp) || quantity < 0 || priceBp <= 0) return null;
  return (quantity * priceBp) / 100_000_000;
}

export function toPotGbp(quantity: number) {
  if (!Number.isFinite(quantity) || quantity < 0) return null;
  return quantity / 10_000;
}
