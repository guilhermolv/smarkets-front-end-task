import { formatPrice } from '../../lib/format';
import type { ContractQuote, ContractSummary } from '../../lib/schemas';
import type { PriceHistory } from '../../types/price';
import { MarketInsight } from '../MarketInsight';
import './PriceTable.scss';

type PriceTableProps = {
  contracts: ContractSummary[];
  isDetailView: boolean;
  priceHistory: PriceHistory;
  quotesByContractId: Map<string, ContractQuote>;
};

export function PriceTable({ contracts, isDetailView, priceHistory, quotesByContractId }: PriceTableProps) {
  return (
    <div className="price-strip">
      <div className="price-table">
        <span className="price-header" aria-hidden="true">
          <b>Selection</b>
          <span>Bid</span>
          <span>Ask</span>
          <span>Last</span>
        </span>
        {contracts.map((contract) => {
          const quote = quotesByContractId.get(contract.id);
          const bestBackPrice = quote?.bestBackPrice ?? null;
          const bestLayPrice = quote?.bestLayPrice ?? null;
          const lastTradedPrice = quote?.lastTradedPrice ?? null;

          return (
            <span className="price-pair" key={contract.id}>
              <b title={contract.name}>{contract.name}</b>
              <span className={bestBackPrice === null ? 'back-price price-empty' : 'back-price'}>
                {formatPrice(bestBackPrice, '--')}
              </span>
              <span className={bestLayPrice === null ? 'lay-price price-empty' : 'lay-price'}>
                {formatPrice(bestLayPrice, '--')}
              </span>
              <span className={lastTradedPrice === null ? 'last-price price-empty' : 'last-price'}>
                {formatPrice(lastTradedPrice, '--')}
              </span>
            </span>
          );
        })}
      </div>
      {isDetailView ? (
        <MarketInsight contracts={contracts} history={priceHistory} quotesByContractId={quotesByContractId} />
      ) : null}
    </div>
  );
}
