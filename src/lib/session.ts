import { ApiRequestError } from './api';
import type { LoginResponse, SessionResponse } from './schemas';

export function isSessionCurrent(session: LoginResponse | SessionResponse | null | undefined) {
  if (!session) return false;
  if (!session.expiresAt) return true;

  const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(session.expiresAt);
  const parsed = Date.parse(hasTimezone ? session.expiresAt : `${session.expiresAt}Z`);

  return !Number.isFinite(parsed) || parsed > Date.now();
}

export function isAuthenticationError(error: unknown) {
  return (
    error instanceof ApiRequestError &&
    (error.status === 401 || ['AUTHENTICATION_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED'].includes(error.errorType ?? ''))
  );
}
