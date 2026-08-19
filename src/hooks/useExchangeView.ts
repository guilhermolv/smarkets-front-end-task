import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchEventDetail, fetchFeaturedEvents, fetchMarketQuotes } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { EventSummary } from '../lib/schemas';
import { isAuthenticationError } from '../lib/session';
import { usePriceHistory } from './usePriceHistory';

const emptyEvents: EventSummary[] = [];

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
    enabled: isAuthenticated && selectedEventId !== null,
  });
  const featuredEvents = eventsQuery.data?.events ?? emptyEvents;
  const eventDetail = eventDetailQuery.data;
  const visibleEvents = useMemo(
    () => (eventDetail?.event ? [eventDetail.event] : featuredEvents),
    [eventDetail, featuredEvents],
  );
  const visibleMarketIds = useMemo(
    () => [...new Set(visibleEvents.flatMap((event) => event.markets.map((market) => market.id)))],
    [visibleEvents],
  );
  const quotesQuery = useQuery({
    queryKey: queryKeys.marketQuotes(visibleMarketIds),
    queryFn: () => fetchMarketQuotes(visibleMarketIds),
    enabled: isAuthenticated && visibleMarketIds.length > 0,
    refetchInterval: 5000,
  });
  const quotesByContractId = useMemo(
    () => new Map(quotesQuery.data?.contracts.map((quote) => [quote.contractId, quote]) ?? []),
    [quotesQuery.data],
  );
  const priceHistory = usePriceHistory(quotesQuery.data);

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
    isLoadingDetail: eventDetailQuery.isLoading,
    isLoadingEvents: eventsQuery.isLoading,
    priceHistory,
    quotesByContractId,
    quotesError: quotesQuery.isError ? quotesQuery.error.message : undefined,
    quotesFetchedAt: quotesQuery.data?.fetchedAt,
    quotesLoaded: Boolean(quotesQuery.data),
  };
}
