import { useState } from 'react';
import { useExchangeQuotes } from '../../context/ExchangeQuotesContext';
import type { ContractSummary } from '../../lib/schemas';
import { OrderBook } from '../OrderBook';
import { PriceTrendChart } from '../PriceTrendChart';
import './MarketInsight.scss';

type MarketInsightProps = {
  contracts: ContractSummary[];
};

export function MarketInsight({ contracts }: MarketInsightProps) {
  const { priceHistory } = useExchangeQuotes();
  const [view, setView] = useState<'chart' | 'book'>('chart');

  return (
    <div className="market-insight">
      <div className="insight-toolbar">
        <div className="insight-toggle" role="group" aria-label="Market insight view">
          <button
            aria-pressed={view === 'chart'}
            className={view === 'chart' ? 'insight-toggle-active' : ''}
            type="button"
            onClick={() => setView('chart')}
          >
            Graph
          </button>
          <button
            aria-pressed={view === 'book'}
            className={view === 'book' ? 'insight-toggle-active' : ''}
            type="button"
            onClick={() => setView('book')}
          >
            Order book
          </button>
        </div>
      </div>
      {view === 'chart' ? <PriceTrendChart contracts={contracts} history={priceHistory} /> : <OrderBook contracts={contracts} />}
    </div>
  );
}
