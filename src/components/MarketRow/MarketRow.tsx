import { useExchangeQuotes } from '../../context/ExchangeQuotesContext';
import { formatContractList, formatState } from '../../lib/format';
import { readDisplayPrice } from '../../lib/quotes';
import type { MarketSummary } from '../../lib/schemas';
import { PriceTable } from '../PriceTable';
import './MarketRow.scss';

type MarketRowProps = {
  market: MarketSummary;
  isDetailView: boolean;
};

export function MarketRow({ market, isDetailView }: MarketRowProps) {
  const { quotesByContractId } = useExchangeQuotes();
  const visibleContracts = market.contracts.slice(0, 3);
  const hasVisiblePrice = visibleContracts.some((contract) => readDisplayPrice(quotesByContractId.get(contract.id)) !== null);

  return (
    <div className={isDetailView ? 'market-row market-row-static' : 'market-row'}>
      <div>
        <strong>{market.name}</strong>
        <span>{formatContractList(market.contracts)}</span>
        {market.contracts.length > 0 ? (
          hasVisiblePrice ? (
            <PriceTable contracts={visibleContracts} isDetailView={isDetailView} />
          ) : (
            <p className="price-unavailable">No live prices available for the visible selections.</p>
          )
        ) : null}
      </div>
      <small>{formatState(market.state)}</small>
    </div>
  );
}
