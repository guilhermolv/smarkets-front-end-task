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

export function formatPrice(price: number | null, fallback: string) {
  if (price === null) return fallback;

  return price >= 100 ? (price / 10000).toFixed(2) : price.toFixed(2);
}

export function formatPercentPrice(price: number) {
  return `${formatPrice(price, '--')}%`;
}

export function formatOrderSize(quantity: number | null) {
  if (quantity === null) return '--';
  return `£${Math.round(quantity).toLocaleString()}`;
}
