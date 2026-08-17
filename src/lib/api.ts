import { z } from 'zod';
import {
  apiErrorSchema,
  eventDetailResponseSchema,
  featuredEventsResponseSchema,
  healthSchema,
  loginResponseSchema,
  logoutResponseSchema,
  quotesResponseSchema,
  sessionResponseSchema,
  type EventDetailResponse,
  type FeaturedEventsResponse,
  type Health,
  type LoginRequest,
  type LoginResponse,
  type LogoutResponse,
  type QuotesResponse,
  type SessionResponse,
} from './schemas';

type ApiRequestOptions<TResponse> = {
  method?: 'DELETE' | 'GET' | 'POST';
  path: string;
  body?: unknown;
  schema: z.Schema<TResponse>;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errorType?: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

export async function apiRequest<TResponse>({ method = 'GET', path, body, schema }: ApiRequestOptions<TResponse>) {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const responseBody: unknown = await response.json();

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(responseBody);
    throw new ApiRequestError(
      parsedError.success ? parsedError.data.message : 'Unexpected API error.',
      response.status,
      parsedError.success ? parsedError.data.errorType : undefined,
      parsedError.success ? parsedError.data.retryAfterSeconds : undefined,
    );
  }

  return schema.parse(responseBody);
}

export function fetchHealth(): Promise<Health> {
  return apiRequest({ path: '/api/health', schema: healthSchema });
}

export function login(credentials: LoginRequest): Promise<LoginResponse> {
  return apiRequest({
    method: 'POST',
    path: '/api/session',
    body: credentials,
    schema: loginResponseSchema,
  });
}

export function fetchSession(): Promise<SessionResponse> {
  return apiRequest({ path: '/api/session', schema: sessionResponseSchema });
}

export function logout(): Promise<LogoutResponse> {
  return apiRequest({ method: 'DELETE', path: '/api/session', schema: logoutResponseSchema });
}

export function fetchFeaturedEvents(category: string): Promise<FeaturedEventsResponse> {
  const params = new URLSearchParams({ category });
  return apiRequest({ path: `/api/events?${params.toString()}`, schema: featuredEventsResponseSchema });
}

export function fetchEventDetail(eventId: string): Promise<EventDetailResponse> {
  return apiRequest({ path: `/api/events/${encodeURIComponent(eventId)}`, schema: eventDetailResponseSchema });
}

export function fetchMarketQuotes(marketIds: string[]): Promise<QuotesResponse> {
  const params = new URLSearchParams({ marketIds: marketIds.join(',') });
  return apiRequest({ path: `/api/quotes?${params.toString()}`, schema: quotesResponseSchema });
}
