import { categories } from '../../constants/categories';
import type { ContractQuote, EventSummary } from '../../lib/schemas';
import type { PriceButtonMode, PriceFormat, PriceHistory } from '../../types/price';
import { CategoryTabs } from '../CategoryTabs';
import { EventCard } from '../EventCard';
import { EventCarousel } from '../EventCarousel';
import { Notice } from '../Notice';
import './EventsPanel.scss';

type EventsPanelProps = {
  isAuthenticated: boolean;
  selectedEventId: string | null;
  selectedCategory: string;
  events: EventSummary[];
  featuredEvents: EventSummary[];
  eventsFetchedAt?: string;
  detailFetchedAt?: string;
  quotesFetchedAt?: string;
  priceButtonMode: PriceButtonMode;
  priceFormat: PriceFormat;
  quotesByContractId: Map<string, ContractQuote>;
  priceHistory: PriceHistory;
  quotesLoaded: boolean;
  isLoadingEvents: boolean;
  isLoadingDetail: boolean;
  eventsError?: string;
  detailError?: string;
  quotesError?: string;
  onSelectPriceButtonMode: (mode: PriceButtonMode) => void;
  onSelectPriceFormat: (format: PriceFormat) => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectEvent: (eventId: string) => void;
  onBackToEvents: () => void;
};

function formatFetchedAt(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function EventsPanel({
  isAuthenticated,
  selectedEventId,
  selectedCategory,
  events,
  featuredEvents,
  eventsFetchedAt,
  detailFetchedAt,
  quotesFetchedAt,
  priceButtonMode,
  priceFormat,
  quotesByContractId,
  priceHistory,
  quotesLoaded,
  isLoadingEvents,
  isLoadingDetail,
  eventsError,
  detailError,
  quotesError,
  onSelectPriceButtonMode,
  onSelectPriceFormat,
  onSelectCategory,
  onSelectEvent,
  onBackToEvents,
}: EventsPanelProps) {
  const selectedCategoryLabel = categories.find((category) => category.id === selectedCategory)?.label ?? 'All';
  const eventTitle = selectedEventId ? events[0]?.name ?? 'Event details' : 'Featured exchange events';
  const priceFormatOptions: Array<{ label: string; value: PriceFormat }> = [
    { label: 'Decimal', value: 'decimal' },
    { label: 'Percent', value: 'percent' },
    { label: 'American', value: 'american' },
  ];
  const priceButtonOptions: Array<{ label: string; value: PriceButtonMode }> = [
    { label: 'Buy price', value: 'buy' },
    { label: 'Sell price', value: 'sell' },
    { label: 'Both prices', value: 'both' },
  ];

  return (
    <section className="panel events-panel">
      <div className="section-heading">
        <div>
          <p className="section-label">{selectedEventId ? 'Event page' : 'Homepage'}</p>
          <h2>{eventTitle}</h2>
        </div>
        <div className="refresh-meta">
          {selectedEventId ? (
            <button className="secondary-button" type="button" onClick={onBackToEvents}>
              Back to events
            </button>
          ) : null}
          {eventsFetchedAt ? <span className="muted">Events {formatFetchedAt(eventsFetchedAt)}</span> : null}
          {detailFetchedAt ? <span className="muted">Detail {formatFetchedAt(detailFetchedAt)}</span> : null}
          {quotesFetchedAt ? <span className="muted">Prices {formatFetchedAt(quotesFetchedAt)}</span> : null}
        </div>
      </div>

      {!selectedEventId ? <CategoryTabs selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} /> : null}

      <div className="price-settings" aria-label="Price display settings">
        <label>
          <span>Price format</span>
          <select value={priceFormat} onChange={(event) => onSelectPriceFormat(event.target.value as PriceFormat)}>
            {priceFormatOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Price buttons</span>
          <select value={priceButtonMode} onChange={(event) => onSelectPriceButtonMode(event.target.value as PriceButtonMode)}>
            {priceButtonOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!isAuthenticated ? <Notice>Log in to load Smarkets events through the proxy.</Notice> : null}
      {isLoadingEvents && !selectedEventId ? <Notice>Loading events from Smarkets...</Notice> : null}
      {isLoadingDetail ? <Notice>Loading event markets from Smarkets...</Notice> : null}
      {eventsError ? <Notice error>Unable to load events. {eventsError}</Notice> : null}
      {detailError ? <Notice error>Unable to load event details. {detailError}</Notice> : null}
      {isAuthenticated && quotesError ? <Notice error>Unable to refresh prices. {quotesError}</Notice> : null}
      {featuredEvents.length === 0 && eventsFetchedAt && !selectedEventId ? (
        <Notice>No upcoming {selectedCategoryLabel.toLowerCase()} events with markets were returned.</Notice>
      ) : null}

      {!selectedEventId && featuredEvents.length ? <EventCarousel events={featuredEvents} onSelectEvent={onSelectEvent} /> : null}

      {events.length ? (
        <div className={selectedEventId ? 'detail-grid' : 'events-grid'}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isDetailView={Boolean(selectedEventId)}
              priceButtonMode={priceButtonMode}
              priceFormat={priceFormat}
              quotesByContractId={quotesByContractId}
              priceHistory={priceHistory}
              quotesLoaded={quotesLoaded}
              onSelectEvent={onSelectEvent}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
