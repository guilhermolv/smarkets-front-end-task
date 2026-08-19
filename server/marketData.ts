import { z } from 'zod';
import { type EventSummary } from '../src/lib/schemas';
import { smarketsClient } from './smarketsClient';

const smarketsEventSchema = z
  .object({
    id: z.string(),
    name: z.string().nullable().optional(),
    full_slug: z.string().nullable().optional(),
    short_name: z.string().nullable().optional(),
    start_datetime: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
  })
  .passthrough();

const smarketsEventsResponseSchema = z.object({
  events: z.array(smarketsEventSchema),
});

const smarketsMarketSchema = z
  .object({
    id: z.string(),
    event_id: z.string(),
    name: z.string().nullable().optional(),
    slug: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
  })
  .passthrough();

const smarketsMarketsResponseSchema = z.object({
  markets: z.array(smarketsMarketSchema),
});

const smarketsContractSchema = z
  .object({
    id: z.string(),
    market_id: z.string(),
    name: z.string().nullable().optional(),
    short_name: z.string().nullable().optional(),
  })
  .passthrough();

const smarketsContractsResponseSchema = z.object({
  contracts: z.array(smarketsContractSchema),
});

const eventCategories = {
  all: null,
  football: ['/sport/football/', 'football_'],
  horse_racing: ['/sport/horse-racing/', 'horse_racing_'],
  greyhound_racing: ['/sport/greyhound-racing/', 'greyhound_racing_', 'greyhound_'],
  tennis: ['/sport/tennis/', 'tennis_'],
  basketball: ['/sport/basketball/', 'basketball_'],
  baseball: ['/sport/baseball/', 'baseball_'],
  politics: ['/politics/', 'politics_'],
} as const;

const featuredEventRequestLimit = 100;
const featuredEventLimit = 24;
const featuredMarketLimit = 3;

export type EventCategory = keyof typeof eventCategories;

function joinIds(ids: string[]) {
  return ids.map(encodeURIComponent).join(',');
}

function displayName(...values: Array<string | null | undefined>) {
  return values.find((value) => value && value.trim().length > 0) ?? 'Untitled';
}

function groupBy<TItem>(items: TItem[], getKey: (item: TItem) => string) {
  const groups = new Map<string, TItem[]>();

  for (const item of items) {
    const key = getKey(item);
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  return groups;
}

function mapEventSummary(
  event: z.infer<typeof smarketsEventSchema>,
  markets: Array<z.infer<typeof smarketsMarketSchema>>,
  contractsByMarketId: Map<string, Array<z.infer<typeof smarketsContractSchema>>>,
  marketLimit?: number,
) {
  return {
    id: event.id,
    name: displayName(event.name, event.short_name, event.full_slug),
    type: event.type ?? null,
    state: event.state ?? null,
    startDateTime: event.start_datetime ?? null,
    markets: markets.slice(0, marketLimit).map((market) => ({
      id: market.id,
      name: displayName(market.name, market.slug),
      state: market.state ?? null,
      contracts: (contractsByMarketId.get(market.id) ?? []).map((contract) => ({
        id: contract.id,
        name: displayName(contract.name, contract.short_name),
      })),
    })),
  } satisfies EventSummary;
}

export function parseEventCategory(value: unknown): EventCategory {
  return typeof value === 'string' && value in eventCategories ? (value as EventCategory) : 'all';
}

export function matchesCategory(event: z.infer<typeof smarketsEventSchema>, category: EventCategory) {
  const matchers = eventCategories[category];
  if (!matchers) return true;

  const fullSlug = event.full_slug ?? '';
  const type = event.type ?? '';
  return matchers.some((matcher) => fullSlug.includes(matcher) || type.startsWith(matcher));
}

export async function fetchFeaturedEvents(sessionToken?: string, categoryInput?: unknown) {
  const category = parseEventCategory(categoryInput);
  const startDateTimeMin = encodeURIComponent(new Date().toISOString());
  const eventResponse = await smarketsClient.request({
    path: `/v3/events/?state=upcoming&limit=${featuredEventRequestLimit}&sort=start_datetime,id&start_datetime_min=${startDateTimeMin}`,
    sessionToken,
    schema: smarketsEventsResponseSchema,
  });

  const events = eventResponse.events.filter((event) => matchesCategory(event, category)).slice(0, featuredEventLimit);
  const eventIds = events.map((event) => event.id);

  if (eventIds.length === 0) {
    return { events: [], fetchedAt: new Date().toISOString(), category };
  }

  const marketsResponse = await smarketsClient.request({
    path: `/v3/events/${joinIds(eventIds)}/markets/`,
    sessionToken,
    schema: smarketsMarketsResponseSchema,
  });

  const marketsByEventId = groupBy(marketsResponse.markets, (market) => market.event_id);
  const marketIds = events.flatMap((event) => (marketsByEventId.get(event.id) ?? []).slice(0, featuredMarketLimit).map((market) => market.id));
  const contractsResponse =
    marketIds.length > 0
      ? await smarketsClient.request({
          path: `/v3/markets/${joinIds(marketIds)}/contracts/`,
          sessionToken,
          schema: smarketsContractsResponseSchema,
        })
      : { contracts: [] };
  const contractsByMarketId = groupBy(contractsResponse.contracts, (contract) => contract.market_id);

  const summaries: EventSummary[] = events
    .map((event) => mapEventSummary(event, marketsByEventId.get(event.id) ?? [], contractsByMarketId, featuredMarketLimit))
    .filter((event) => event.markets.length > 0);

  return {
    events: summaries,
    fetchedAt: new Date().toISOString(),
    category,
  };
}

export async function fetchEventDetail(eventId: string, sessionToken?: string) {
  const eventResponse = await smarketsClient.request({
    path: `/v3/events/${encodeURIComponent(eventId)}/`,
    sessionToken,
    schema: smarketsEventsResponseSchema,
  });
  const event = eventResponse.events[0];

  if (!event) {
    throw new Error('Smarkets did not return this event.');
  }

  const marketsResponse = await smarketsClient.request({
    path: `/v3/events/${encodeURIComponent(eventId)}/markets/`,
    sessionToken,
    schema: smarketsMarketsResponseSchema,
  });
  const markets = marketsResponse.markets;
  const marketIds = markets.map((market) => market.id).slice(0, 50);
  const contractsResponse =
    marketIds.length > 0
      ? await smarketsClient.request({
          path: `/v3/markets/${joinIds(marketIds)}/contracts/`,
          sessionToken,
          schema: smarketsContractsResponseSchema,
        })
      : { contracts: [] };
  const contractsByMarketId = groupBy(contractsResponse.contracts, (contract) => contract.market_id);

  return {
    event: mapEventSummary(event, markets, contractsByMarketId),
    fetchedAt: new Date().toISOString(),
  };
}
