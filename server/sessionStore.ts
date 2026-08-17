import type { CookieOptions, Response } from 'express';

export type StoredSession = {
  token: string;
  expiresAt: string | null;
  status: 'authenticated' | 'pending_verification';
};

const SESSION_COOKIE_NAME = 'smarkets_task_session';
const sessions = new Map<string, StoredSession>();
const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

function parseSessionExpiry(expiresAt: string) {
  const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(expiresAt);
  const parsed = Date.parse(hasTimezone ? expiresAt : `${expiresAt}Z`);
  return Number.isFinite(parsed) ? parsed : null;
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;

  const expiry = parseSessionExpiry(expiresAt);
  return expiry !== null && expiry <= Date.now();
}

export function createLocalSession(response: Response, session: StoredSession) {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, session);

  response.cookie(SESSION_COOKIE_NAME, sessionId, {
    ...sessionCookieOptions,
    maxAge: session.expiresAt ? Math.max(parseSessionExpiry(session.expiresAt) ?? 0, Date.now()) - Date.now() : undefined,
  });

  return sessionId;
}

export function getLocalSession(sessionId: string | undefined) {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);

  if (!session) return null;

  if (isExpired(session.expiresAt)) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

export function clearLocalSession(response: Response, sessionId: string | undefined) {
  if (sessionId) sessions.delete(sessionId);

  response.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
}

export function getSessionIdFromCookieHeader(cookieHeader: string | undefined) {
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(SESSION_COOKIE_NAME.length + 1);
}

export { SESSION_COOKIE_NAME };
