import { FormEvent, PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiRequestError, fetchEventDetail, fetchFeaturedEvents, fetchHealth, fetchMarketQuotes, fetchSession, login, logout } from './lib/api';
import { formatContractList, formatDateTime, formatEventType, formatPrice, formatState } from './lib/format';
import type { ContractQuote, ContractSummary, EventSummary, LoginResponse, MarketSummary, SessionResponse } from './lib/schemas';

type PricePoint = {
  timestamp: string;
  price: number;
};

type PriceHistory = Record<string, PricePoint[]>;

const categories = [
  { id: 'all', label: 'All' },
  { id: 'football', label: 'Football' },
  { id: 'horse_racing', label: 'Horse Racing' },
  { id: 'greyhound_racing', label: 'Greyhound Racing' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'baseball', label: 'Baseball' },
  { id: 'politics', label: 'Politics' },
];

const detailMarketPageSize = 10;

function readEventIdFromPath() {
  const match = window.location.pathname.match(/^\/events\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function isSessionCurrent(session: LoginResponse | SessionResponse | null | undefined) {
  if (!session) return false;
  if (!session.expiresAt) return true;

  const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(session.expiresAt);
  const parsed = Date.parse(hasTimezone ? session.expiresAt : `${session.expiresAt}Z`);

  return !Number.isFinite(parsed) || parsed > Date.now();
}

function readDisplayPrice(quote: { bestBackPrice: number | null; bestLayPrice: number | null; lastTradedPrice: number | null } | undefined) {
  return quote?.bestBackPrice ?? quote?.lastTradedPrice ?? quote?.bestLayPrice ?? null;
}

function marketHasPrice(market: MarketSummary, quotesByContractId: Map<string, ContractQuote>) {
  return market.contracts.some((contract) => readDisplayPrice(quotesByContractId.get(contract.id)) !== null);
}

function formatPercentPrice(price: number) {
  return `${formatPrice(price, '--')}%`;
}

function formatOrderSize(quantity: number | null) {
  if (quantity === null) return '--';
  return `£${Math.round(quantity).toLocaleString()}`;
}

function isAuthenticationError(error: unknown) {
  return (
    error instanceof ApiRequestError &&
    (error.status === 401 || ['AUTHENTICATION_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED'].includes(error.errorType ?? ''))
  );
}

function PriceTrendChart({ contracts, history }: { contracts: ContractSummary[]; history: PriceHistory }) {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const colours = ['#10b981', '#3b82f6', '#8b5cf6'];
  const plotStartX = 0;
  const plotEndX = 68;
  const plotWidth = plotEndX - plotStartX;
  const series = contracts
    .slice(0, 3)
    .map((contract, index) => ({
      contract,
      colour: colours[index],
      points: history[contract.id] ?? [],
    }))
    .filter((item) => item.points.length > 1);
  const values = series.flatMap((item) => item.points.map((point) => point.price));

  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const longestSeriesLength = Math.max(...series.map((item) => item.points.length));
  const yForPrice = (price: number) => 36 - ((price - min) / range) * 30;
  const hoverIndex =
    hoverX === null
      ? longestSeriesLength - 1
      : Math.max(
          0,
          Math.min(longestSeriesLength - 1, Math.round(((Math.min(Math.max(hoverX, plotStartX), plotEndX) - plotStartX) / plotWidth) * (longestSeriesLength - 1))),
        );
  const hoverTimestamp = series.find((item) => item.points[hoverIndex])?.points[hoverIndex]?.timestamp ?? series[0].points.at(-1)?.timestamp;
  const hoverRows = series.map((item) => {
    const point = item.points[Math.min(hoverIndex, item.points.length - 1)];
    return { ...item, point };
  });
  const sortedHoverRows = [...hoverRows].sort((left, right) => right.point.price - left.point.price);
  const labelPlacements = (() => {
    const minLabelY = 10;
    const maxLabelY = 34;
    const labelGap = 8;
    let placements = sortedHoverRows
      .map((item) => ({
        ...item,
        y: Math.max(minLabelY, Math.min(maxLabelY, yForPrice(item.point.price))),
      }))
      .sort((left, right) => left.y - right.y);

    for (let index = 1; index < placements.length; index += 1) {
      placements[index] = {
        ...placements[index],
        y: Math.max(placements[index].y, placements[index - 1].y + labelGap),
      };
    }

    const overflow = placements.at(-1) ? placements.at(-1)!.y - maxLabelY : 0;
    if (overflow > 0) {
      placements = placements.map((placement) => ({ ...placement, y: placement.y - overflow }));
    }

    for (let index = placements.length - 2; index >= 0; index -= 1) {
      placements[index] = {
        ...placements[index],
        y: Math.min(placements[index].y, placements[index + 1].y - labelGap),
      };
    }

    const underflow = placements[0] ? minLabelY - placements[0].y : 0;
    if (underflow > 0) {
      placements = placements.map((placement) => ({ ...placement, y: placement.y + underflow }));
    }

    return placements;
  })();
  const sampledX = longestSeriesLength === 1 ? plotStartX : plotStartX + (hoverIndex / (longestSeriesLength - 1)) * plotWidth;
  const guideX = hoverX === null ? plotEndX : Math.min(Math.max(hoverX, plotStartX), plotEndX);

  function pathFor(points: PricePoint[]) {
    return points
      .map((point, index) => {
        const x = points.length === 1 ? plotStartX : plotStartX + (index / (points.length - 1)) * plotWidth;
        const y = 36 - ((point.price - min) / range) * 30;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const nextHoverX = ((event.clientX - bounds.left) / bounds.width) * 100;
    setHoverX(Math.max(plotStartX, Math.min(plotEndX, nextHoverX)));
  }

  return (
    <div className="price-trend" aria-label="Polled price trend">
      <div className="price-trend-stage">
        <svg
          onPointerLeave={() => {
            setHoverX(null);
          }}
          onPointerMove={handlePointerMove}
          preserveAspectRatio="none"
          role="img"
          tabIndex={0}
          viewBox="0 0 100 40"
        >
          <line x1="0" x2="100" y1="6" y2="6" />
          <line x1="0" x2="100" y1="20" y2="20" />
          <line x1="0" x2="100" y1="34" y2="34" />
          {series.map((item) => (
            <path d={pathFor(item.points)} key={item.contract.id} stroke={item.colour} />
          ))}
          {hoverX !== null ? (
            <>
              {hoverRows.map(({ contract, colour, point }) => {
                const x = sampledX;
                const y = yForPrice(point.price);

                return <circle cx={x} cy={y} fill={colour} key={contract.id} r="1.4" />;
              })}
            </>
          ) : null}
        </svg>
        {hoverX !== null ? <span className="price-trend-guide-overlay" style={{ left: `${guideX}%` }} /> : null}
        <div className={hoverX === null ? 'price-trend-readout price-trend-readout-latest' : 'price-trend-readout'} style={{ left: `${guideX}%` }}>
          <strong>{hoverTimestamp ? new Date(hoverTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Latest'}</strong>
          {labelPlacements.map(({ contract, colour, point, y }) => (
            <span key={contract.id} style={{ color: colour, top: `${(y / 40) * 100}%` }}>
              <em>{contract.name}</em>
              <b>{formatPercentPrice(point.price)}</b>
            </span>
          ))}
        </div>
      </div>
      <div className="price-trend-legend">
        {series.map((item) => (
          <span key={item.contract.id}>
            <i style={{ background: item.colour }} />
            {item.contract.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function OrderBook({ contracts, quotesByContractId }: { contracts: ContractSummary[]; quotesByContractId: Map<string, ContractQuote> }) {
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
              <span className="offer-size">{formatOrderSize(offer?.quantity ?? null)}</span>
              <span>{offer ? formatPercentPrice(offer.price) : '--'}</span>
              <span>{bid ? formatPercentPrice(bid.price) : '--'}</span>
              <span className="bid-size">{formatOrderSize(bid?.quantity ?? null)}</span>
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

function MarketInsight({
  contracts,
  history,
  quotesByContractId,
}: {
  contracts: ContractSummary[];
  history: PriceHistory;
  quotesByContractId: Map<string, ContractQuote>;
}) {
  const [view, setView] = useState<'chart' | 'book'>('chart');

  return (
    <div className="market-insight">
      <div className="insight-toggle" aria-label="Market insight view">
        <button className={view === 'chart' ? 'insight-toggle-active' : ''} type="button" onClick={() => setView('chart')}>
          Graph
        </button>
        <button className={view === 'book' ? 'insight-toggle-active' : ''} type="button" onClick={() => setView('book')}>
          Order book
        </button>
      </div>
      {view === 'chart' ? <PriceTrendChart contracts={contracts} history={history} /> : <OrderBook contracts={contracts} quotesByContractId={quotesByContractId} />}
    </div>
  );
}

function EventCarousel({ events, onSelectEvent }: { events: EventSummary[]; onSelectEvent: (eventId: string) => void }) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<{ pointerId: number; x: number; scrollLeft: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function scrollByCards(direction: -1 | 1) {
    railRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!railRef.current) return;

    dragStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      scrollLeft: railRef.current.scrollLeft,
    };
    railRef.current.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!railRef.current || !dragStart.current) return;

    const delta = event.clientX - dragStart.current.x;
    if (Math.abs(delta) > 4) setIsDragging(true);
    railRef.current.scrollLeft = dragStart.current.scrollLeft - delta;
  }

  function endDrag() {
    dragStart.current = null;
    window.setTimeout(() => setIsDragging(false), 0);
  }

  return (
    <div className="carousel-shell">
      <div className="carousel-controls" aria-label="Featured event carousel controls">
        <button className="carousel-control" type="button" onClick={() => scrollByCards(-1)} aria-label="Scroll featured events left">
          ‹
        </button>
        <button className="carousel-control" type="button" onClick={() => scrollByCards(1)} aria-label="Scroll featured events right">
          ›
        </button>
      </div>
      <div
        className={isDragging ? 'event-carousel event-carousel-dragging' : 'event-carousel'}
        onPointerCancel={endDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        ref={railRef}
      >
        {events.slice(0, 8).map((event) => (
          <button
            className="carousel-card"
            key={event.id}
            type="button"
            onClick={() => {
              if (!isDragging) onSelectEvent(event.id);
            }}
          >
            <span>{formatEventType(event.type)}</span>
            <strong>{event.name}</strong>
            <small>{formatDateTime(event.startDateTime)}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

export function App() {
  const queryClient = useQueryClient();
  const healthQuery = useQuery({ queryKey: ['proxy-health'], queryFn: fetchHealth });
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showUnavailableMarkets, setShowUnavailableMarkets] = useState(false);
  const [visibleMarketLimit, setVisibleMarketLimit] = useState(detailMarketPageSize);
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    refetchOnWindowFocus: false,
  });
  const restoredSession = sessionQuery.data?.status !== 'anonymous' ? sessionQuery.data : null;
  const activeSession = isSessionCurrent(session) ? session : isSessionCurrent(restoredSession) ? restoredSession : null;
  const isAuthenticated = activeSession?.status === 'authenticated';
  const [selectedCategory, setSelectedCategory] = useState('all');
  const selectedCategoryLabel = categories.find((category) => category.id === selectedCategory)?.label ?? 'All';
  const eventsQuery = useQuery({
    queryKey: ['featured-events', selectedCategory],
    queryFn: () => fetchFeaturedEvents(selectedCategory),
    enabled: isAuthenticated,
  });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(() => readEventIdFromPath());
  function navigateToEvent(eventId: string) {
    window.history.pushState(null, '', `/events/${encodeURIComponent(eventId)}`);
    setSelectedEventId(eventId);
  }

  function navigateToHomepage() {
    window.history.pushState(null, '', '/');
    setSelectedEventId(null);
  }

  useEffect(() => {
    function handlePopState() {
      setSelectedEventId(readEventIdFromPath());
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  useEffect(() => {
    setShowUnavailableMarkets(false);
    setVisibleMarketLimit(detailMarketPageSize);
  }, [selectedEventId]);
  const eventDetailQuery = useQuery({
    queryKey: ['event-detail', selectedEventId],
    queryFn: () => fetchEventDetail(selectedEventId ?? ''),
    enabled: isAuthenticated && selectedEventId !== null,
  });
  const visibleEvents = eventDetailQuery.data?.event ? [eventDetailQuery.data.event] : (eventsQuery.data?.events ?? []);
  const visibleMarketIds = useMemo(
    () => visibleEvents.flatMap((event) => event.markets.map((market) => market.id)),
    [visibleEvents],
  );
  const quotesQuery = useQuery({
    queryKey: ['market-quotes', visibleMarketIds],
    queryFn: () => fetchMarketQuotes(visibleMarketIds),
    enabled: isAuthenticated && visibleMarketIds.length > 0,
    refetchInterval: 5000,
  });
  const quotesByContractId = useMemo(
    () => new Map(quotesQuery.data?.contracts.map((quote) => [quote.contractId, quote]) ?? []),
    [quotesQuery.data],
  );
  const [priceHistory, setPriceHistory] = useState<PriceHistory>({});
  useEffect(() => {
    if (!quotesQuery.data) return;

    setPriceHistory((currentHistory) => {
      let hasChanges = false;
      const nextHistory = { ...currentHistory };

      for (const quote of quotesQuery.data.contracts) {
        const price = readDisplayPrice(quote);
        if (price === null) continue;

        const existingPoints = nextHistory[quote.contractId] ?? [];
        if (existingPoints.at(-1)?.timestamp === quotesQuery.data.fetchedAt) continue;

        nextHistory[quote.contractId] = [...existingPoints, { timestamp: quotesQuery.data.fetchedAt, price }].slice(-24);
        hasChanges = true;
      }

      return hasChanges ? nextHistory : currentHistory;
    });
  }, [quotesQuery.data]);
  useEffect(() => {
    const sessionError = [eventsQuery.error, eventDetailQuery.error, quotesQuery.error].find(isAuthenticationError);
    if (!sessionError) return;

    setSession(null);
    navigateToHomepage();
    queryClient.setQueryData(['session'], {
      status: 'anonymous',
      factor: null,
      expiresAt: null,
      message: sessionError.message,
    });
    queryClient.removeQueries({ queryKey: ['featured-events'] });
    queryClient.removeQueries({ queryKey: ['event-detail'] });
    queryClient.removeQueries({ queryKey: ['market-quotes'] });
    setFormError(sessionError.message);
  }, [eventDetailQuery.error, eventsQuery.error, queryClient, quotesQuery.error]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setSession(null);
      navigateToHomepage();
      queryClient.setQueryData(['session'], {
        status: 'anonymous',
        factor: null,
        expiresAt: null,
        message: 'Logged out of the local Smarkets session.',
      });
      queryClient.removeQueries({ queryKey: ['featured-events'] });
      queryClient.removeQueries({ queryKey: ['event-detail'] });
      queryClient.removeQueries({ queryKey: ['market-quotes'] });
    },
  });

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const username = String(formData.get('username') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!username || !password) {
      setFormError('Enter your Smarkets email and password.');
      return;
    }

    setIsLoggingIn(true);
    setFormError(null);

    try {
      const data = await login({ username, password });
      form.reset();
      setSession(data);
      queryClient.setQueryData(['session'], data);
      queryClient.invalidateQueries({ queryKey: ['featured-events', selectedCategory] });
    } catch (error) {
      setSession(null);
      setFormError(error instanceof Error ? error.message : 'Unable to log in to Smarkets right now.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <main className={`shell theme-${theme}`}>
      <header className="top-bar">
        <div>
          <p className="eyebrow">Smarkets exchange task</p>
          <h1>Exchange Explorer</h1>
        </div>
        <div className="top-actions">
          <span className={healthQuery.data?.status === 'ok' ? 'status status-ok' : 'status'}>{healthQuery.data?.status ?? 'checking'}</span>
          <button className="theme-toggle" type="button" onClick={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </header>

      {healthQuery.isError ? <p className="notice error shell-notice">Proxy unavailable. Start the dev server with npm run dev.</p> : null}

      <section className={activeSession ? 'auth-layout auth-layout-compact' : 'auth-layout'}>
        {!activeSession ? (
          <form className="panel login-panel" onSubmit={handleLoginSubmit}>
            <div>
              <p className="section-label">Smarkets account</p>
              <h2>Log in</h2>
            </div>

            <label>
              Email
              <input name="username" type="email" autoComplete="username" placeholder="you@example.com" />
            </label>

            <label>
              Password
              <input name="password" type="password" autoComplete="current-password" />
            </label>

            {formError ? <p className="notice error" role="alert">{formError}</p> : null}

            <button type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        ) : null}

        {!activeSession ? (
          <section className="panel login-copy">
            <p className="section-label">Live exchange data</p>
            <h2>Markets, contracts and prices through a secure proxy.</h2>
            <p>
              Sign in once, then browse upcoming events, inspect event markets and follow bid, ask and last-traded movement
              without exposing the Smarkets session token to the browser.
            </p>
            <div className="feature-list">
              <span>HTTP-only local session</span>
              <span>Validated API responses</span>
              <span>Polling price trends</span>
            </div>
          </section>
        ) : (
        <section className="panel session-panel" aria-live="polite">
          <div className="session-header">
            <p className="section-label">Session state</p>
            <button className="secondary-button" type="button" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
              {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
            </button>
          </div>
          <h2>{activeSession.status === 'authenticated' ? 'Authenticated' : 'Verification required'}</h2>
          <p>{activeSession.message}</p>
          <dl className="health-grid session-grid">
            <div>
              <dt>Factor</dt>
              <dd>{activeSession.factor ?? 'complete'}</dd>
            </div>
            <div>
              <dt>Token expiry</dt>
              <dd>{activeSession.expiresAt ? new Date(activeSession.expiresAt).toLocaleString() : 'Not supplied'}</dd>
            </div>
          </dl>
        </section>
        )}
      </section>

      <section className="panel events-panel">
        <div className="section-heading">
          <div>
            <p className="section-label">{selectedEventId ? 'Event page' : 'Homepage'}</p>
            <h2>{selectedEventId ? eventDetailQuery.data?.event.name ?? 'Event details' : 'Featured exchange events'}</h2>
          </div>
          <div className="refresh-meta">
            {selectedEventId ? (
              <button className="secondary-button" type="button" onClick={navigateToHomepage}>
                Back to events
              </button>
            ) : null}
            {eventsQuery.data ? <span className="muted">Events {new Date(eventsQuery.data.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> : null}
            {eventDetailQuery.data ? <span className="muted">Detail {new Date(eventDetailQuery.data.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> : null}
            {quotesQuery.data ? <span className="muted">Prices {new Date(quotesQuery.data.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> : null}
          </div>
        </div>

        {!selectedEventId ? (
          <div className="category-tabs" aria-label="Event category">
            {categories.map((category) => (
              <button
                className={category.id === selectedCategory ? 'category-tab category-tab-active' : 'category-tab'}
                key={category.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(category.id);
                  navigateToHomepage();
                }}
              >
                {category.label}
              </button>
            ))}
          </div>
        ) : null}

        {!isAuthenticated ? <p className="notice">Log in to load Smarkets events through the proxy.</p> : null}
        {eventsQuery.isLoading && !selectedEventId ? <p className="notice">Loading events from Smarkets...</p> : null}
        {eventDetailQuery.isLoading ? <p className="notice">Loading event markets from Smarkets...</p> : null}
        {eventsQuery.isError ? <p className="notice error">Unable to load events. {eventsQuery.error.message}</p> : null}
        {eventDetailQuery.isError ? <p className="notice error">Unable to load event details. {eventDetailQuery.error.message}</p> : null}
        {isAuthenticated && quotesQuery.isError ? <p className="notice error">Unable to refresh prices. {quotesQuery.error.message}</p> : null}
        {eventsQuery.data?.events.length === 0 && !selectedEventId ? (
          <p className="notice">No upcoming {selectedCategoryLabel.toLowerCase()} events with markets were returned.</p>
        ) : null}

        {!selectedEventId && eventsQuery.data?.events.length ? (
          <EventCarousel events={eventsQuery.data.events} onSelectEvent={navigateToEvent} />
        ) : null}

        {visibleEvents.length ? (
          <div className={selectedEventId ? 'detail-grid' : 'events-grid'}>
            {visibleEvents.map((event) => {
              const rankedMarkets = [...event.markets].sort(
                (left, right) => Number(marketHasPrice(right, quotesByContractId)) - Number(marketHasPrice(left, quotesByContractId)),
              );
              const pricedMarketCount = rankedMarkets.filter((market) => marketHasPrice(market, quotesByContractId)).length;
              const unavailableMarketCount = rankedMarkets.length - pricedMarketCount;
              const shouldHideUnavailableMarkets = Boolean(selectedEventId && quotesQuery.data && !showUnavailableMarkets);
              const filteredMarkets = shouldHideUnavailableMarkets
                ? rankedMarkets.filter((market) => marketHasPrice(market, quotesByContractId))
                : rankedMarkets;
              const visibleMarkets = selectedEventId ? filteredMarkets.slice(0, visibleMarketLimit) : filteredMarkets;
              const remainingMarketCount = filteredMarkets.length - visibleMarkets.length;

              return (
              <article className={selectedEventId ? 'event-card detail-card' : 'event-card'} key={event.id}>
                <header>
                  <div>
                    <p className="event-meta">{formatEventType(event.type)}</p>
                    <h3>{event.name}</h3>
                  </div>
                  <time dateTime={event.startDateTime ?? undefined}>{formatDateTime(event.startDateTime)}</time>
                </header>
                {selectedEventId ? (
                  <div className="market-toolbar">
                    <span>{pricedMarketCount} priced markets</span>
                    <span>{unavailableMarketCount} unavailable</span>
                    {unavailableMarketCount > 0 ? (
                      <label className="market-toggle">
                        <input
                          checked={showUnavailableMarkets}
                          onChange={(event) => setShowUnavailableMarkets(event.target.checked)}
                          type="checkbox"
                        />
                        Show unavailable markets
                      </label>
                    ) : null}
                  </div>
                ) : null}
                <div className="market-list">
                  {visibleMarkets.length ? (
                    visibleMarkets.map((market) => (
                      <div
                        className={selectedEventId ? 'market-row market-row-static' : 'market-row market-row-interactive'}
                        key={market.id}
                        role={selectedEventId ? undefined : 'button'}
                        tabIndex={selectedEventId ? undefined : 0}
                        onClick={selectedEventId ? undefined : () => navigateToEvent(event.id)}
                        onKeyDown={
                          selectedEventId
                            ? undefined
                            : (keyboardEvent) => {
                                if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                                  keyboardEvent.preventDefault();
                                  navigateToEvent(event.id);
                                }
                              }
                        }
                      >
                        <div>
                          <strong>{market.name}</strong>
                          <span>{formatContractList(market.contracts)}</span>
                          {market.contracts.length > 0
                            ? (() => {
                                const visibleContracts = market.contracts.slice(0, 3);
                                const hasVisiblePrice = visibleContracts.some((contract) => readDisplayPrice(quotesByContractId.get(contract.id)) !== null);

                                if (!hasVisiblePrice) {
                                  return <p className="price-unavailable">No live prices available for the visible selections.</p>;
                                }

                                return (
                                  <div className="price-strip">
                                    <div className="price-table">
                                      <span className="price-header" aria-hidden="true">
                                        <b>Selection</b>
                                        <span>Bid</span>
                                        <span>Ask</span>
                                        <span>Last</span>
                                      </span>
                                      {visibleContracts.map((contract) => {
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
                                    {selectedEventId ? (
                                      <MarketInsight contracts={visibleContracts} history={priceHistory} quotesByContractId={quotesByContractId} />
                                    ) : null}
                                  </div>
                                );
                              })()
                            : null}
                        </div>
                        <small>{formatState(market.state)}</small>
                      </div>
                    ))
                  ) : (
                    <p className="empty-markets">
                      {selectedEventId && pricedMarketCount === 0 && !showUnavailableMarkets
                        ? 'No priced markets are available yet. Use the toggle above to inspect unavailable markets.'
                        : 'No markets returned for this event.'}
                    </p>
                  )}
                </div>
                {selectedEventId && remainingMarketCount > 0 ? (
                  <button
                    className="event-action market-load-more"
                    type="button"
                    onClick={() => setVisibleMarketLimit((currentLimit) => currentLimit + detailMarketPageSize)}
                  >
                    Show {Math.min(detailMarketPageSize, remainingMarketCount)} more markets
                  </button>
                ) : null}
                {!selectedEventId ? (
                  <button className="event-action" type="button" onClick={() => navigateToEvent(event.id)}>
                    View event markets
                  </button>
                ) : null}
              </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}
