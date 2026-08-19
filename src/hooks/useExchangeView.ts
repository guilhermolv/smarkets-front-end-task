import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchEventDetail, fetchFeaturedEvents, fetchMarketQuotes } from '../lib/api';
import { demoChartFixture, isDemoEventId, isDemoMarketId } from '../lib/demoChartEvent';
import { queryKeys } from '../lib/queryKeys';
import { isAuthenticationError } from '../lib/session';
import { usePriceHistory } from './usePriceHistory';

type UseExchangeViewOptions = {
  isAuthenticated: boolean;
  selectedCategory: string;
  selectedEventId: string | null;
  onSessionExpired: (message: string) => void;
};

export function useExchangeView({ isAuthenticated, selectedCategory, selectedEventId, onSessionExpired }: UseExchangeViewOptions) {
  const eventsQuery = useQuery({
    queryKey: queryKeys.featuredEvents(selectedCategory),
    queryFn: () => fetchFeaturedEvents(selectedCategory),
    enabled: isAuthenticated,
  });
  const eventDetailQuery = useQuery({
    queryKey: queryKeys.eventDetail(selectedEventId ?? ''),
    queryFn: () => fetchEventDetail(selectedEventId ?? ''),
    enabled: isAuthenticated && selectedEventId !== null && !isDemoEventId(selectedEventId),
  });
  const featuredEvents = useMemo(() => [demoChartFixture.event, ...(eventsQuery.data?.events ?? [])], [eventsQuery.data]);
  const visibleEvents = useMemo(() => {
    if (isDemoEventId(selectedEventId)) return [demoChartFixture.event];
    if (eventDetailQuery.data?.event) return [eventDetailQuery.data.event];
    return featuredEvents;
  }, [eventDetailQuery.data, featuredEvents, selectedEventId]);
  const visibleMarketIds = useMemo(
    () => [
      ...new Set(
        visibleEvents.flatMap((event) => event.markets.map((market) => market.id)).filter((marketId) => !isDemoMarketId(marketId)),
      ),
    ],
    [visibleEvents],
  );
  const quotesQuery = useQuery({
    queryKey: queryKeys.marketQuotes(visibleMarketIds),
    queryFn: () => fetchMarketQuotes(visibleMarketIds),
    enabled: isAuthenticated && visibleMarketIds.length > 0,
    refetchInterval: 5000,
  });
  const quotesByContractId = useMemo(() => {
    const quotes = new Map(quotesQuery.data?.contracts.map((quote) => [quote.contractId, quote]) ?? []);
    for (const quote of demoChartFixture.quotes) {
      quotes.set(quote.contractId, quote);
    }
    return quotes;
  }, [quotesQuery.data]);
  const livePriceHistory = usePriceHistory(quotesQuery.data);
  const priceHistory = useMemo(
    () => ({
      ...livePriceHistory,
      ...demoChartFixture.history,
    }),
    [livePriceHistory],
  );

  useEffect(() => {
    const sessionError = [eventsQuery.error, eventDetailQuery.error, quotesQuery.error].find(isAuthenticationError);
    if (!sessionError) return;

    onSessionExpired(sessionError.message);
  }, [eventDetailQuery.error, eventsQuery.error, onSessionExpired, quotesQuery.error]);

  return {
    detailError: eventDetailQuery.isError ? eventDetailQuery.error.message : undefined,
    detailFetchedAt: eventDetailQuery.data?.fetchedAt,
    events: visibleEvents,
    eventsError: eventsQuery.isError ? eventsQuery.error.message : undefined,
    eventsFetchedAt: eventsQuery.data?.fetchedAt,
    featuredEvents,
    isLoadingDetail: eventDetailQuery.isLoading && !isDemoEventId(selectedEventId),
    isLoadingEvents: eventsQuery.isLoading,
    priceHistory,
    quotesByContractId,
    quotesError: quotesQuery.isError ? quotesQuery.error.message : undefined,
    quotesFetchedAt: quotesQuery.data?.fetchedAt,
    quotesLoaded: Boolean(quotesQuery.data) || visibleEvents.some((event) => isDemoEventId(event.id)),
  };
}
