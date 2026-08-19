import { useQuery } from '@tanstack/react-query';
import { AppShell } from './components/AppShell';
import { AuthSection } from './components/AuthSection';
import { EventsPanel } from './components/EventsPanel';
import { Notice } from './components/Notice';
import { TopBar } from './components/TopBar';
import { PriceDisplayProvider } from './context/PriceDisplayContext';
import { useAuth } from './hooks/useAuth';
import { useEventNavigation } from './hooks/useEventNavigation';
import { useTheme } from './hooks/useTheme';
import { fetchHealth } from './lib/api';
import { queryKeys } from './lib/queryKeys';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const { selectedEventId, selectedCategory, navigateToEvent, navigateToHomepage, selectCategory } = useEventNavigation();
  const healthQuery = useQuery({ queryKey: queryKeys.health, queryFn: fetchHealth });
  const auth = useAuth({ onNavigateHome: navigateToHomepage });

  return (
    <PriceDisplayProvider>
      <AppShell theme={theme}>
        <TopBar
          healthStatus={healthQuery.data?.status}
          isLoggingOut={auth.isLoggingOut}
          showLogout={Boolean(auth.activeSession)}
          theme={theme}
          onLogout={auth.logout}
          onToggleTheme={toggleTheme}
        />

        {healthQuery.isError ? (
          <Notice error className="shell-notice">
            Proxy unavailable. Start the dev server with npm run dev.
          </Notice>
        ) : null}

        {auth.isAuthenticated ? null : (
          <AuthSection
            formError={auth.formError}
            isLoggingIn={auth.isLoggingIn}
            verificationRequired={auth.activeSession?.status === 'verification_required'}
            onLogin={auth.handleLogin}
          />
        )}

        <EventsPanel
          isAuthenticated={auth.isAuthenticated}
          selectedCategory={selectedCategory}
          selectedEventId={selectedEventId}
          onBackToEvents={navigateToHomepage}
          onSelectCategory={selectCategory}
          onSelectEvent={navigateToEvent}
          onSessionExpired={auth.handleSessionExpired}
        />
      </AppShell>
    </PriceDisplayProvider>
  );
}
