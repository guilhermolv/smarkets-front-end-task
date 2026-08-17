import type { PriceFormat } from '../types/price';

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

function normalizeDecimalPrice(price: number) {
  return price >= 100 ? price / 10000 : price;
}

export function formatPrice(price: number | null, fallback: string, format: PriceFormat = 'decimal') {
  if (price === null) return fallback;

  const decimalPrice = normalizeDecimalPrice(price);

  if (format === 'percent') {
    return `${(100 / decimalPrice).toFixed(2)}%`;
  }

  if (format === 'american') {
    if (decimalPrice >= 2) return `+${Math.round((decimalPrice - 1) * 100)}`;
    return `${Math.round(-100 / (decimalPrice - 1))}`;
  }

  return decimalPrice.toFixed(2);
}

export function formatPercentPrice(price: number) {
  return formatPrice(price, '--', 'percent');
}

export function formatOrderSize(quantity: number | null) {
  if (quantity === null) return '--';
  return `£${Math.round(quantity).toLocaleString()}`;
}
