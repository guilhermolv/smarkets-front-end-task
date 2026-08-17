import { z } from 'zod';
import { loginRequestSchema } from '../src/lib/schemas';

const SMARKETS_BASE_URL = 'https://api.smarkets.com';
type HttpMethod = 'GET' | 'POST';

const smarketsTokenResponseSchema = z.object({
  token: z.string().nullable(),
  stop: z.string().nullable(),
  factor: z.enum(['complete', 'totp', 'nemid']).optional(),
  verify: z.boolean().optional(),
  redirect_url: z.string().url().optional(),
});

const smarketsErrorSchema = z.object({
  error_type: z.string(),
  data: z.unknown(),
});

export class SmarketsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errorType?: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

export class SmarketsResponseValidationError extends Error {
  readonly status = 502;
  readonly errorType = 'UPSTREAM_RESPONSE_VALIDATION_ERROR';

  constructor(
    public readonly path: string,
    public readonly issues: z.ZodIssue[],
  ) {
    super(`Smarkets returned an unexpected response shape for ${path}.`);
  }
}

export function isSmarketsSessionError(error: SmarketsApiError) {
  return error.status === 401 || ['AUTHENTICATION_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED'].includes(error.errorType ?? '');
}

function errorMessageFor(errorType?: string) {
  switch (errorType) {
    case 'AUTHENTICATION_REQUIRED':
    case 'INVALID_SESSION':
    case 'SESSION_EXPIRED':
      return 'Your Smarkets session has expired. Log in again to refresh market data.';
    case 'INVALID_CREDENTIALS':
      return 'The username or password was not accepted by Smarkets.';
    case 'PASSWORD_RESET_NEEDED':
      return 'Smarkets requires a password reset before this account can log in.';
    case 'RATE_LIMIT_EXCEEDED':
      return 'Smarkets rate limit reached. Wait a moment before trying again.';
    case 'IP_NOT_TRUSTED':
    case 'DEVICE_NOT_TRUSTED':
      return 'Smarkets needs additional trust verification for this login.';
    case 'COUNTRY_BLOCKED':
    case 'SOURCE_BLOCKED':
    case 'CLIENT_JURISDICTION_MISMATCH':
      return 'Smarkets blocked this login because of account or location restrictions.';
    case 'SESSION_LIMIT_REACHED':
      return 'Smarkets reports that the account has reached its session limit.';
    case 'REQUEST_VALIDATION_ERROR':
      return 'Smarkets rejected the request shape. Check the proxy payload mapping for this endpoint.';
    default:
      return 'Unable to log in to Smarkets right now.';
  }
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function readRateLimitReset(response: Response) {
  const value = response.headers.get('x-ratelimit-reset');
  if (!value) return undefined;

  const seconds = Number(value);
  return Number.isFinite(seconds) ? seconds : undefined;
}

type SmarketsRequestOptions<TResponse> = {
  method?: HttpMethod;
  path: string;
  body?: unknown;
  sessionToken?: string;
  schema: z.Schema<TResponse>;
};

async function requestSmarkets<TResponse>({
  method = 'GET',
  path,
  body,
  sessionToken,
  schema,
}: SmarketsRequestOptions<TResponse>) {
  const response = await fetch(`${SMARKETS_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(sessionToken ? { Authorization: `Session-Token ${sessionToken}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const responseBody = await readJson(response);

  if (!response.ok) {
    const parsedError = smarketsErrorSchema.safeParse(responseBody);
    const errorType = parsedError.data?.error_type;
    const retryAfterSeconds = readRateLimitReset(response);
    const message =
      errorType === 'RATE_LIMIT_EXCEEDED' && retryAfterSeconds
        ? `Smarkets rate limit reached. Wait ${retryAfterSeconds} seconds before trying again.`
        : errorMessageFor(errorType);

    throw new SmarketsApiError(message, response.status, errorType, retryAfterSeconds);
  }

  const parsedBody = schema.safeParse(responseBody);

  if (!parsedBody.success) {
    throw new SmarketsResponseValidationError(path, parsedBody.error.issues);
  }

  return parsedBody.data;
}

export async function createSmarketsSession(input: unknown) {
  const credentials = loginRequestSchema.parse(input);

  return requestSmarkets({
    method: 'POST',
    path: '/v3/sessions/',
    body: {
      username: credentials.username,
      password: credentials.password,
    },
    schema: smarketsTokenResponseSchema,
  });
}

export const smarketsClient = {
  request: requestSmarkets,
  createSession: createSmarketsSession,
};
