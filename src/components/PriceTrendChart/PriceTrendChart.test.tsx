import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PriceDisplayProvider } from '../../context/PriceDisplayContext';
import type { ContractSummary } from '../../lib/schemas';
import type { PriceHistory } from '../../types/price';
import { PriceTrendChart } from './PriceTrendChart';

const contracts: ContractSummary[] = [{ id: 'home', name: 'Home' }];

function renderChart(history: PriceHistory) {
  return render(
    <PriceDisplayProvider>
      <PriceTrendChart contracts={contracts} history={history} />
    </PriceDisplayProvider>,
  );
}

describe('PriceTrendChart', () => {
  it('explains that the trend needs a second polled sample', () => {
    renderChart({
      home: [{ timestamp: '2026-08-15T09:00:00Z', price: 5000 }],
    });

    expect(screen.getByText(/appears after the next refresh/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Polled price trend')).not.toBeInTheDocument();
  });

  it('renders the plot once two samples exist', () => {
    renderChart({
      home: [
        { timestamp: '2026-08-15T09:00:00Z', price: 5000 },
        { timestamp: '2026-08-15T09:00:05Z', price: 5100 },
      ],
    });

    expect(screen.getByLabelText('Polled price trend', { exact: true })).toBeInTheDocument();
    expect(screen.queryByText(/appears after the next refresh/i)).not.toBeInTheDocument();
  });
});
