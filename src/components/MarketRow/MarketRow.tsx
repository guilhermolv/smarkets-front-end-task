import { formatContractList, formatState } from '../../lib/format';
import { readDisplayPrice } from '../../lib/quotes';
import type { ContractQuote, MarketSummary } from '../../lib/schemas';
import type { PriceHistory } from '../../types/price';
import { PriceTable } from '../PriceTable';
import './MarketRow.scss';

type MarketRowProps = {
  market: MarketSummary;
  isDetailView: boolean;
  quotesByContractId: Map<string, ContractQuote>;
  priceHistory: PriceHistory;
  onSelectEvent?: () => void;
};

export function MarketRow({ market, isDetailView, quotesByContractId, priceHistory, onSelectEvent }: MarketRowProps) {
  const visibleContracts = market.contracts.slice(0, 3);
  const hasVisiblePrice = visibleContracts.some((contract) => readDisplayPrice(quotesByContractId.get(contract.id)) !== null);

  return (
    <div
      className={isDetailView ? 'market-row market-row-static' : 'market-row market-row-interactive'}
      role={isDetailView ? undefined : 'button'}
      tabIndex={isDetailView ? undefined : 0}
      onClick={isDetailView ? undefined : onSelectEvent}
      onKeyDown={
        isDetailView
          ? undefined
          : (keyboardEvent) => {
              if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                keyboardEvent.preventDefault();
                onSelectEvent?.();
              }
            }
      }
    >
      <div>
        <strong>{market.name}</strong>
        <span>{formatContractList(market.contracts)}</span>
        {market.contracts.length > 0 ? (
          hasVisiblePrice ? (
            <PriceTable
              contracts={visibleContracts}
              isDetailView={isDetailView}
              priceHistory={priceHistory}
              quotesByContractId={quotesByContractId}
            />
          ) : (
            <p className="price-unavailable">No live prices available for the visible selections.</p>
          )
        ) : null}
      </div>
      <small>{formatState(market.state)}</small>
    </div>
  );
}
