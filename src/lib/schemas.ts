import { z } from 'zod';

export const healthSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  smarketsBaseUrl: z.string().url(),
});

export type Health = z.infer<typeof healthSchema>;

export const loginRequestSchema = z.object({
  username: z.string().email('Enter the email address for your Smarkets account.'),
  password: z.string().min(1, 'Enter your Smarkets password.'),
});

export const loginResponseSchema = z.object({
  status: z.enum(['authenticated', 'verification_required']),
  factor: z.enum(['complete', 'totp', 'nemid']).nullable(),
  expiresAt: z.string().nullable(),
  message: z.string(),
});

export const sessionResponseSchema = z.object({
  status: z.enum(['authenticated', 'verification_required', 'anonymous']),
  factor: z.enum(['complete', 'totp', 'nemid']).nullable(),
  expiresAt: z.string().nullable(),
  message: z.string(),
});

export const logoutResponseSchema = z.object({
  status: z.literal('anonymous'),
  message: z.string(),
});

export const apiErrorSchema = z.object({
  message: z.string(),
  errorType: z.string().optional(),
  retryAfterSeconds: z.number().optional(),
});

export const contractSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const quoteLevelSchema = z.object({
  price: z.number(),
  quantity: z.number().nullable(),
});

export const contractQuoteSchema = z.object({
  contractId: z.string(),
  bestBackPrice: z.number().nullable(),
  bestLayPrice: z.number().nullable(),
  bids: z.array(quoteLevelSchema),
  offers: z.array(quoteLevelSchema),
  lastTradedPrice: z.number().nullable(),
  lastTradedAt: z.string().nullable(),
});

export const quotesResponseSchema = z.object({
  contracts: z.array(contractQuoteSchema),
  fetchedAt: z.string(),
});

export const marketSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  state: z.string().nullable(),
  contracts: z.array(contractSummarySchema),
});

export const eventSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().nullable(),
  state: z.string().nullable(),
  startDateTime: z.string().nullable(),
  markets: z.array(marketSummarySchema),
});

export const featuredEventsResponseSchema = z.object({
  events: z.array(eventSummarySchema),
  fetchedAt: z.string(),
  category: z.string(),
});

export const eventDetailResponseSchema = z.object({
  event: eventSummarySchema,
  fetchedAt: z.string(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
export type ContractSummary = z.infer<typeof contractSummarySchema>;
export type ContractQuote = z.infer<typeof contractQuoteSchema>;
export type QuotesResponse = z.infer<typeof quotesResponseSchema>;
export type MarketSummary = z.infer<typeof marketSummarySchema>;
export type EventSummary = z.infer<typeof eventSummarySchema>;
export type FeaturedEventsResponse = z.infer<typeof featuredEventsResponseSchema>;
export type EventDetailResponse = z.infer<typeof eventDetailResponseSchema>;
