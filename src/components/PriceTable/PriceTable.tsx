import type { CSSProperties } from 'react';
import { formatPrice } from '../../lib/format';
import type { ContractQuote, ContractSummary } from '../../lib/schemas';
import type { PriceButtonMode, PriceFormat, PriceHistory } from '../../types/price';
import { MarketInsight } from '../MarketInsight';
import './PriceTable.scss';

type PriceTableProps = {
  contracts: ContractSummary[];
  isDetailView: boolean;
  priceButtonMode: PriceButtonMode;
  priceFormat: PriceFormat;
  priceHistory: PriceHistory;
  quotesByContractId: Map<string, ContractQuote>;
};

export function PriceTable({ contracts, isDetailView, priceButtonMode, priceFormat, priceHistory, quotesByContractId }: PriceTableProps) {
  const showBuyPrice = priceButtonMode === 'buy' || priceButtonMode === 'both';
  const showSellPrice = priceButtonMode === 'sell' || priceButtonMode === 'both';
  const priceColumnCount = Number(showBuyPrice) + Number(showSellPrice);
  const priceTableStyle = { '--price-column-count': priceColumnCount } as CSSProperties;

  return (
    <div className="price-strip">
      <div className="price-table" style={priceTableStyle}>
        <span className="price-header" aria-hidden="true">
          <b>Selection</b>
          {showBuyPrice ? <span>Buy</span> : null}
          {showSellPrice ? <span>Sell</span> : null}
        </span>
        {contracts.map((contract) => {
          const quote = quotesByContractId.get(contract.id);
          const bestBackPrice = quote?.bestBackPrice ?? null;
          const bestLayPrice = quote?.bestLayPrice ?? null;

          return (
            <span className="price-pair" key={contract.id}>
              <b title={contract.name}>{contract.name}</b>
              {showBuyPrice ? (
                <span className={bestBackPrice === null ? 'back-price price-empty' : 'back-price'}>
                  {formatPrice(bestBackPrice, '--', priceFormat)}
                </span>
              ) : null}
              {showSellPrice ? (
                <span className={bestLayPrice === null ? 'lay-price price-empty' : 'lay-price'}>
                  {formatPrice(bestLayPrice, '--', priceFormat)}
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
      {isDetailView ? (
        <MarketInsight contracts={contracts} history={priceHistory} priceFormat={priceFormat} quotesByContractId={quotesByContractId} />
      ) : null}
    </div>
  );
}
