import { FormEvent, useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSession, login, logout } from '../lib/api';
import { clearExchangeSession } from '../lib/exchangeSession';
import { queryKeys } from '../lib/queryKeys';
import { isSessionCurrent } from '../lib/session';

type UseAuthOptions = {
  onNavigateHome: () => void;
};

export function useAuth({ onNavigateHome }: UseAuthOptions) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const sessionQuery = useQuery({
    queryKey: queryKeys.session,
    queryFn: fetchSession,
    refetchOnWindowFocus: false,
  });
  const restoredSession = sessionQuery.data && sessionQuery.data.status !== 'anonymous' ? sessionQuery.data : null;
  const activeSession = isSessionCurrent(restoredSession) ? restoredSession : null;
  const isAuthenticated = activeSession?.status === 'authenticated';

  const loginMutation = useMutation({
    mutationFn: login,
    gcTime: 0,
    onSuccess: (data) => {
      setFormError(null);
      queryClient.setQueryData(queryKeys.session, data);
      queryClient.invalidateQueries({ queryKey: ['featured-events'] });
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'Unable to log in to Smarkets right now.');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      onNavigateHome();
      clearExchangeSession(queryClient, 'Logged out of the local Smarkets session.');
    },
  });

  const handleSessionExpired = useCallback(
    (message: string) => {
      onNavigateHome();
      clearExchangeSession(queryClient, message);
      setFormError(message);
    },
    [onNavigateHome, queryClient],
  );

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const username = String(formData.get('username') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!username || !password) {
      setFormError('Enter your Smarkets email and password.');
      return;
    }

    setFormError(null);

    try {
      await loginMutation.mutateAsync({ username, password });
      form.reset();
    } catch {
      // Error copy is set in onError. Credentials are not stored on the mutation after gcTime: 0.
    }
  }

  return {
    activeSession,
    formError,
    handleLogin,
    handleSessionExpired,
    isAuthenticated,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    logout: () => logoutMutation.mutate(),
  };
}
