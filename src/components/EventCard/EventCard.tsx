import { useEffect, useState } from 'react';
import { detailMarketPageSize } from '../../constants/categories';
import { formatDateTime, formatEventType } from '../../lib/format';
import { marketHasPrice } from '../../lib/quotes';
import type { ContractQuote, EventSummary } from '../../lib/schemas';
import type { PriceButtonMode, PriceFormat, PriceHistory } from '../../types/price';
import { MarketRow } from '../MarketRow';
import { MarketToolbar } from '../MarketToolbar';
import './EventCard.scss';

type EventCardProps = {
  event: EventSummary;
  isDetailView: boolean;
  priceButtonMode: PriceButtonMode;
  priceFormat: PriceFormat;
  quotesByContractId: Map<string, ContractQuote>;
  priceHistory: PriceHistory;
  quotesLoaded: boolean;
  onSelectEvent: (eventId: string) => void;
};

export function EventCard({ event, isDetailView, priceButtonMode, priceFormat, quotesByContractId, priceHistory, quotesLoaded, onSelectEvent }: EventCardProps) {
  const [showUnavailableMarkets, setShowUnavailableMarkets] = useState(false);
  const [visibleMarketLimit, setVisibleMarketLimit] = useState(detailMarketPageSize);

  useEffect(() => {
    setShowUnavailableMarkets(false);
    setVisibleMarketLimit(detailMarketPageSize);
  }, [event.id, isDetailView]);
  const rankedMarkets = [...event.markets].sort(
    (left, right) => Number(marketHasPrice(right, quotesByContractId)) - Number(marketHasPrice(left, quotesByContractId)),
  );
  const pricedMarketCount = rankedMarkets.filter((market) => marketHasPrice(market, quotesByContractId)).length;
  const unavailableMarketCount = rankedMarkets.length - pricedMarketCount;
  const shouldHideUnavailableMarkets = Boolean(isDetailView && quotesLoaded && !showUnavailableMarkets);
  const filteredMarkets = shouldHideUnavailableMarkets
    ? rankedMarkets.filter((market) => marketHasPrice(market, quotesByContractId))
    : rankedMarkets;
  const visibleMarkets = isDetailView ? filteredMarkets.slice(0, visibleMarketLimit) : filteredMarkets;
  const remainingMarketCount = filteredMarkets.length - visibleMarkets.length;

  return (
    <article className={isDetailView ? 'event-card detail-card' : 'event-card'}>
      <header>
        <div>
          <p className="event-meta">{formatEventType(event.type)}</p>
          <h3>{event.name}</h3>
        </div>
        <time dateTime={event.startDateTime ?? undefined}>{formatDateTime(event.startDateTime)}</time>
      </header>
      {isDetailView ? (
        <MarketToolbar
          pricedMarketCount={pricedMarketCount}
          unavailableMarketCount={unavailableMarketCount}
          showUnavailableMarkets={showUnavailableMarkets}
          onToggleUnavailableMarkets={setShowUnavailableMarkets}
        />
      ) : null}
      <div className="market-list">
        {visibleMarkets.length ? (
          visibleMarkets.map((market) => (
            <MarketRow
              key={market.id}
              market={market}
              isDetailView={isDetailView}
              priceButtonMode={priceButtonMode}
              priceFormat={priceFormat}
              quotesByContractId={quotesByContractId}
              priceHistory={priceHistory}
              onSelectEvent={() => onSelectEvent(event.id)}
            />
          ))
        ) : (
          <p className="empty-markets">
            {isDetailView && pricedMarketCount === 0 && !showUnavailableMarkets
              ? 'No priced markets are available yet. Use the toggle above to inspect unavailable markets.'
              : 'No markets returned for this event.'}
          </p>
        )}
      </div>
      {isDetailView && remainingMarketCount > 0 ? (
        <button
          className="event-action market-load-more"
          type="button"
          onClick={() => setVisibleMarketLimit((currentLimit) => currentLimit + detailMarketPageSize)}
        >
          Show {Math.min(detailMarketPageSize, remainingMarketCount)} more markets
        </button>
      ) : null}
      {!isDetailView ? (
        <button className="event-action" type="button" onClick={() => onSelectEvent(event.id)}>
          View event markets
        </button>
      ) : null}
    </article>
  );
}
