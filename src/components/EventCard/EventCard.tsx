import { useState } from 'react';
import { detailMarketPageSize } from '../../constants/categories';
import { useExchangeQuotes } from '../../context/ExchangeQuotesContext';
import { formatDateTime, formatEventType } from '../../lib/format';
import { applyFrozenMarketOrder, marketHasPrice, snapshotPricedMarketOrder } from '../../lib/quotes';
import type { EventSummary } from '../../lib/schemas';
import { MarketRow } from '../MarketRow';
import { MarketToolbar } from '../MarketToolbar';
import './EventCard.scss';

type EventCardProps = {
  event: EventSummary;
  isDetailView: boolean;
  onSelectEvent: (eventId: string) => void;
};

export function EventCard({ event, isDetailView, onSelectEvent }: EventCardProps) {
  const { quotesByContractId, quotesLoaded } = useExchangeQuotes();
  const [showUnavailableMarkets, setShowUnavailableMarkets] = useState(false);
  const [visibleMarketLimit, setVisibleMarketLimit] = useState(detailMarketPageSize);
  const [frozenMarketIds, setFrozenMarketIds] = useState<string[] | null>(null);
  const nextFrozenMarketIds = snapshotPricedMarketOrder(event.markets, quotesByContractId, quotesLoaded, frozenMarketIds);

  if (nextFrozenMarketIds !== frozenMarketIds) {
    setFrozenMarketIds(nextFrozenMarketIds);
  }

  const rankedMarkets = applyFrozenMarketOrder(event.markets, nextFrozenMarketIds);
  const pricedMarketCount = rankedMarkets.filter((market) => marketHasPrice(market, quotesByContractId)).length;
  const unavailableMarketCount = rankedMarkets.length - pricedMarketCount;
  const shouldHideUnavailableMarkets = Boolean(isDetailView && quotesLoaded && !showUnavailableMarkets);
  const filteredMarkets = shouldHideUnavailableMarkets
    ? rankedMarkets.filter((market) => marketHasPrice(market, quotesByContractId))
    : rankedMarkets;
  const visibleMarkets = isDetailView ? filteredMarkets.slice(0, visibleMarketLimit) : filteredMarkets;
  const remainingMarketCount = filteredMarkets.length - visibleMarkets.length;

  return (
    <article
      className={isDetailView ? 'event-card detail-card' : 'event-card event-card-clickable'}
      onClick={isDetailView ? undefined : () => onSelectEvent(event.id)}
    >
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
          visibleMarkets.map((market) => <MarketRow key={market.id} market={market} isDetailView={isDetailView} />)
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
        <button
          className="event-action"
          type="button"
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onSelectEvent(event.id);
          }}
        >
          View event markets
        </button>
      ) : null}
    </article>
  );
}
