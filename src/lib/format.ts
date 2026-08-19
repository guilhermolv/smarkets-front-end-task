import type { PriceFormat } from '../types/price';
import { toAmericanOdds, toBackStakeGbp, toDecimalOdds, toImpliedPercent, toPotGbp } from './price';

export function formatEventType(type: string | null) {
  if (!type) return 'Event';

  return type
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function formatState(state: string | null) {
  if (!state) return 'Open';

  return state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
}

export function formatDateTime(value: string | null) {
  if (!value) return 'TBC';

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export function formatContractList(contracts: Array<{ name: string }>) {
  if (contracts.length === 0) return 'Contracts pending';

  const visibleContracts = contracts.slice(0, 3).map((contract) => contract.name);
  const remaining = contracts.length - visibleContracts.length;

  return remaining > 0 ? `${visibleContracts.join(', ')} +${remaining} more` : visibleContracts.join(', ');
}

export function formatChartTime(timestamp: string | undefined) {
  if (!timestamp) return 'Latest';

  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatChartScrubLabel(timestamp: string | undefined) {
  if (!timestamp) return 'Latest';

  return new Date(timestamp)
    .toLocaleString(undefined, {
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
    })
    .toUpperCase();
}

function formatGbp(amount: number) {
  return `£${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPrice(price: number | null, fallback: string, format: PriceFormat = 'decimal') {
  if (price === null) return fallback;

  if (format === 'percent') {
    const percent = toImpliedPercent(price);
    return percent === null ? fallback : `${percent.toFixed(2)}%`;
  }

  if (format === 'american') {
    const decimalOdds = toDecimalOdds(price);
    const american = decimalOdds === null ? null : toAmericanOdds(decimalOdds);
    if (american === null) return fallback;
    const rounded = Math.round(american);
    return rounded > 0 ? `+${rounded}` : `${rounded}`;
  }

  const decimalOdds = toDecimalOdds(price);
  return decimalOdds === null ? fallback : decimalOdds.toFixed(2);
}

export function formatOrderSize(quantity: number | null, priceBp: number | null = null) {
  if (quantity === null) return '--';

  if (priceBp !== null) {
    const stake = toBackStakeGbp(quantity, priceBp);
    return stake === null ? '--' : formatGbp(stake);
  }

  const pot = toPotGbp(quantity);
  return pot === null ? '--' : formatGbp(pot);
}
