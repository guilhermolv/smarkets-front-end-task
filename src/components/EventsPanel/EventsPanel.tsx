import { categories } from '../../constants/categories';
import { ExchangeQuotesProvider } from '../../context/ExchangeQuotesContext';
import { useExchangeView } from '../../hooks/useExchangeView';
import { CategoryTabs } from '../CategoryTabs';
import { EventCard } from '../EventCard';
import { EventCarousel } from '../EventCarousel';
import { Notice } from '../Notice';
import './EventsPanel.scss';

type EventsPanelProps = {
  isAuthenticated: boolean;
  selectedCategory: string;
  selectedEventId: string | null;
  onBackToEvents: () => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectEvent: (eventId: string) => void;
  onSessionExpired: (message: string) => void;
};

function formatFetchedAt(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function EventsPanel({
  isAuthenticated,
  selectedCategory,
  selectedEventId,
  onBackToEvents,
  onSelectCategory,
  onSelectEvent,
  onSessionExpired,
}: EventsPanelProps) {
  const view = useExchangeView({
    isAuthenticated,
    onSessionExpired,
    selectedCategory,
    selectedEventId,
  });
  const selectedCategoryLabel = categories.find((category) => category.id === selectedCategory)?.label ?? 'All';
  const eventTitle = selectedEventId ? (view.events[0]?.name ?? 'Event details') : 'Featured exchange events';

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
          {view.eventsFetchedAt ? <span className="muted">Events {formatFetchedAt(view.eventsFetchedAt)}</span> : null}
          {view.detailFetchedAt ? <span className="muted">Detail {formatFetchedAt(view.detailFetchedAt)}</span> : null}
          {view.quotesFetchedAt ? <span className="muted">Prices {formatFetchedAt(view.quotesFetchedAt)}</span> : null}
        </div>
      </div>

      {!selectedEventId ? <CategoryTabs selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} /> : null}

      {!isAuthenticated ? (
        <Notice>Log in to load Smarkets events through the proxy. A local chart stress event is available without login.</Notice>
      ) : null}
      {view.isLoadingEvents && !selectedEventId ? <Notice>Loading events from Smarkets...</Notice> : null}
      {view.isLoadingDetail ? <Notice>Loading event markets from Smarkets...</Notice> : null}
      {view.eventsError ? <Notice error>Unable to load events. {view.eventsError}</Notice> : null}
      {view.detailError ? <Notice error>Unable to load event details. {view.detailError}</Notice> : null}
      {isAuthenticated && view.quotesError ? <Notice error>Unable to refresh prices. {view.quotesError}</Notice> : null}
      {view.featuredEvents.length === 0 && view.eventsFetchedAt && !selectedEventId ? (
        <Notice>No upcoming {selectedCategoryLabel.toLowerCase()} events with markets were returned.</Notice>
      ) : null}

      {!selectedEventId && view.featuredEvents.length ? <EventCarousel events={view.featuredEvents} onSelectEvent={onSelectEvent} /> : null}

      {view.events.length ? (
        <ExchangeQuotesProvider
          priceHistory={view.priceHistory}
          quotesByContractId={view.quotesByContractId}
          quotesLoaded={view.quotesLoaded}
        >
          <div className={selectedEventId ? 'detail-grid' : 'events-grid'}>
            {view.events.map((event) => (
              <EventCard
                key={`${event.id}-${selectedEventId ? 'detail' : 'list'}`}
                event={event}
                isDetailView={Boolean(selectedEventId)}
                onSelectEvent={onSelectEvent}
              />
            ))}
          </div>
        </ExchangeQuotesProvider>
      ) : null}
    </section>
  );
}
