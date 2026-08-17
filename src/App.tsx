import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from './components/AppShell';
import { AuthSection } from './components/AuthSection';
import { EventsPanel } from './components/EventsPanel';
import { Notice } from './components/Notice';
import { TopBar } from './components/TopBar';
import { useEventNavigation } from './hooks/useEventNavigation';
import { usePriceHistory } from './hooks/usePriceHistory';
import { useTheme } from './hooks/useTheme';
import { fetchEventDetail, fetchFeaturedEvents, fetchHealth, fetchMarketQuotes, fetchSession, login, logout } from './lib/api';
import { isAuthenticationError, isSessionCurrent } from './lib/session';
import type { LoginResponse } from './lib/schemas';

export function App() {
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const { selectedEventId, navigateToEvent, navigateToHomepage } = useEventNavigation();
  const healthQuery = useQuery({ queryKey: ['proxy-health'], queryFn: fetchHealth });
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    refetchOnWindowFocus: false,
  });
  const restoredSession = sessionQuery.data && sessionQuery.data.status !== 'anonymous' ? sessionQuery.data : null;
  const activeSession = isSessionCurrent(session) ? session : isSessionCurrent(restoredSession) ? restoredSession : null;
  const isAuthenticated = activeSession?.status === 'authenticated';
  const eventsQuery = useQuery({
    queryKey: ['featured-events', selectedCategory],
    queryFn: () => fetchFeaturedEvents(selectedCategory),
    enabled: isAuthenticated,
  });
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
  const priceHistory = usePriceHistory(quotesQuery.data);
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
  }, [eventDetailQuery.error, eventsQuery.error, navigateToHomepage, queryClient, quotesQuery.error]);

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

  function handleSelectCategory(categoryId: string) {
    setSelectedCategory(categoryId);
    navigateToHomepage();
  }

  return (
    <AppShell theme={theme}>
      <TopBar healthStatus={healthQuery.data?.status} theme={theme} onToggleTheme={toggleTheme} />

      {healthQuery.isError ? <Notice error className="shell-notice">Proxy unavailable. Start the dev server with npm run dev.</Notice> : null}

      <AuthSection
        activeSession={activeSession}
        formError={formError}
        isLoggingIn={isLoggingIn}
        isLoggingOut={logoutMutation.isPending}
        onLogin={handleLoginSubmit}
        onLogout={() => logoutMutation.mutate()}
      />

      <EventsPanel
        isAuthenticated={isAuthenticated}
        selectedEventId={selectedEventId}
        selectedCategory={selectedCategory}
        events={visibleEvents}
        featuredEvents={eventsQuery.data?.events ?? []}
        eventsFetchedAt={eventsQuery.data?.fetchedAt}
        detailFetchedAt={eventDetailQuery.data?.fetchedAt}
        quotesFetchedAt={quotesQuery.data?.fetchedAt}
        quotesByContractId={quotesByContractId}
        priceHistory={priceHistory}
        quotesLoaded={Boolean(quotesQuery.data)}
        isLoadingEvents={eventsQuery.isLoading}
        isLoadingDetail={eventDetailQuery.isLoading}
        eventsError={eventsQuery.isError ? eventsQuery.error.message : undefined}
        detailError={eventDetailQuery.isError ? eventDetailQuery.error.message : undefined}
        quotesError={quotesQuery.isError ? quotesQuery.error.message : undefined}
        onSelectCategory={handleSelectCategory}
        onSelectEvent={navigateToEvent}
        onBackToEvents={navigateToHomepage}
      />
    </AppShell>
  );
}
