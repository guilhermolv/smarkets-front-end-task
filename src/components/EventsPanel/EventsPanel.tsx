import { categories } from '../../constants/categories';
import type { ContractQuote, EventSummary } from '../../lib/schemas';
import type { PriceHistory } from '../../types/price';
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
  quotesByContractId: Map<string, ContractQuote>;
  priceHistory: PriceHistory;
  quotesLoaded: boolean;
  isLoadingEvents: boolean;
  isLoadingDetail: boolean;
  eventsError?: string;
  detailError?: string;
  quotesError?: string;
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
  quotesByContractId,
  priceHistory,
  quotesLoaded,
  isLoadingEvents,
  isLoadingDetail,
  eventsError,
  detailError,
  quotesError,
  onSelectCategory,
  onSelectEvent,
  onBackToEvents,
}: EventsPanelProps) {
  const selectedCategoryLabel = categories.find((category) => category.id === selectedCategory)?.label ?? 'All';
  const eventTitle = selectedEventId ? events[0]?.name ?? 'Event details' : 'Featured exchange events';

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
