import { useState } from 'react';
import type { ContractQuote, ContractSummary } from '../../lib/schemas';
import type { PriceHistory } from '../../types/price';
import { OrderBook } from '../OrderBook';
import { PriceTrendChart } from '../PriceTrendChart';
import './MarketInsight.scss';

type MarketInsightProps = {
  contracts: ContractSummary[];
  history: PriceHistory;
  quotesByContractId: Map<string, ContractQuote>;
};

export function MarketInsight({ contracts, history, quotesByContractId }: MarketInsightProps) {
  const [view, setView] = useState<'chart' | 'book'>('chart');

  return (
    <div className="market-insight">
      <div className="insight-toggle" aria-label="Market insight view">
        <button className={view === 'chart' ? 'insight-toggle-active' : ''} type="button" onClick={() => setView('chart')}>
          Graph
        </button>
        <button className={view === 'book' ? 'insight-toggle-active' : ''} type="button" onClick={() => setView('book')}>
          Order book
        </button>
      </div>
      {view === 'chart' ? <PriceTrendChart contracts={contracts} history={history} /> : <OrderBook contracts={contracts} quotesByContractId={quotesByContractId} />}
    </div>
  );
}
