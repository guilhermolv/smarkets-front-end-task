export const queryKeys = {
  health: ['proxy-health'] as const,
  session: ['session'] as const,
  featuredEvents: (category: string) => ['featured-events', category] as const,
  eventDetail: (eventId: string) => ['event-detail', eventId] as const,
  marketQuotes: (marketIds: string[]) => ['market-quotes', [...marketIds].sort()] as const,
};
