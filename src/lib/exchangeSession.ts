import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export function clearExchangeSession(queryClient: QueryClient, message: string) {
  queryClient.setQueryData(queryKeys.session, {
    status: 'anonymous',
    factor: null,
    expiresAt: null,
    message,
  });
  queryClient.removeQueries({ queryKey: ['featured-events'] });
  queryClient.removeQueries({ queryKey: ['event-detail'] });
  queryClient.removeQueries({ queryKey: ['market-quotes'] });
}
