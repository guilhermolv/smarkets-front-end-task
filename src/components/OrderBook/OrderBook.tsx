import { useState } from 'react';
import { useExchangeQuotes } from '../../context/ExchangeQuotesContext';
import { usePriceDisplay } from '../../context/PriceDisplayContext';
import { formatOrderSize, formatPrice } from '../../lib/format';
import type { ContractSummary } from '../../lib/schemas';
import './OrderBook.scss';

type OrderBookProps = {
  contracts: ContractSummary[];
};

export function OrderBook({ contracts }: OrderBookProps) {
  const { priceFormat } = usePriceDisplay();
  const { quotesByContractId } = useExchangeQuotes();
  const [selectedContractId, setSelectedContractId] = useState(contracts[0]?.id ?? '');
  const [depth, setDepth] = useState(3);
  const selectedContract = contracts.find((contract) => contract.id === selectedContractId) ?? contracts[0];
  const selectedQuote = selectedContract ? quotesByContractId.get(selectedContract.id) : undefined;
  const offers = selectedQuote?.offers.slice(0, depth) ?? [];
  const bids = selectedQuote?.bids.slice(0, depth) ?? [];
  const rows = Array.from({ length: Math.max(offers.length, bids.length, depth) });

  if (!selectedContract) return null;

  return (
    <div className="order-book">
      <div className="order-book-header">
        <strong>Order book</strong>
        <span><i className="book-dot book-dot-offer" />Sell orders</span>
        <span><i className="book-dot book-dot-bid" />Buy orders</span>
      </div>

      <div className="order-book-table">
        <span>Order size</span>
        <span>Price</span>
        <span>Price</span>
        <span>Order size</span>
        {rows.map((_, index) => {
          const offer = offers[index];
          const bid = bids[index];

          return (
            <div className="order-book-row" key={`${selectedContract.id}-${index}`}>
              <span className="offer-size">{formatOrderSize(offer?.quantity ?? null, offer?.price ?? null)}</span>
              <span>{offer ? formatPrice(offer.price, '--', priceFormat) : '--'}</span>
              <span>{bid ? formatPrice(bid.price, '--', priceFormat) : '--'}</span>
              <span className="bid-size">{formatOrderSize(bid?.quantity ?? null, bid?.price ?? null)}</span>
            </div>
          );
        })}
      </div>

      <div className="order-book-controls">
        <label>
          Selected contract
          <select value={selectedContract.id} onChange={(event) => setSelectedContractId(event.target.value)}>
            {contracts.map((contract) => (
              <option key={contract.id} value={contract.id}>
                {contract.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Depth
          <select value={depth} onChange={(event) => setDepth(Number(event.target.value))}>
            {[3, 5, 10].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
