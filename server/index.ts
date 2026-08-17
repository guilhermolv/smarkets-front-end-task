import express from 'express';
import { z } from 'zod';
import { fetchEventDetail, fetchFeaturedEvents } from './marketData';
import { fetchMarketQuotes } from './quotes';
import { createSmarketsSession, isSmarketsSessionError, SmarketsApiError, SmarketsResponseValidationError } from './smarketsClient';
import { clearLocalSession, createLocalSession, getLocalSession, getSessionIdFromCookieHeader, type StoredSession } from './sessionStore';
import { loginRequestSchema } from '../src/lib/schemas';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use('/api', (_request, response, next) => {
  response.setHeader('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'smarkets-proxy',
    smarketsBaseUrl: 'https://api.smarkets.com/v3',
  });
});

app.get('/api/session', (request, response) => {
  const localSession = getLocalSession(getSessionIdFromCookieHeader(request.headers.cookie));

  if (!localSession) {
    response.json({
      status: 'anonymous',
      factor: null,
      expiresAt: null,
      message: 'No active local Smarkets session.',
    });
    return;
  }

  response.json({
    status: localSession.status === 'authenticated' ? 'authenticated' : 'verification_required',
    factor: localSession.status === 'authenticated' ? 'complete' : null,
    expiresAt: localSession.expiresAt,
    message:
      localSession.status === 'authenticated'
        ? 'Restored the active local Smarkets session.'
        : 'A local Smarkets session is waiting for verification.',
  });
});

function getRequiredSession(request: express.Request, response: express.Response): StoredSession | null {
  const sessionId = getSessionIdFromCookieHeader(request.headers.cookie);
  const localSession = getLocalSession(sessionId);

  if (!localSession) {
    clearLocalSession(response, sessionId);
    response.status(401).json({ message: 'Log in to Smarkets before loading market data.', errorType: 'AUTHENTICATION_REQUIRED' });
    return null;
  }

  return localSession;
}

app.post('/api/session', async (request, response, next) => {
  try {
    const credentials = loginRequestSchema.safeParse(request.body);

    if (!credentials.success) {
      response.status(400).json({ message: 'Enter a valid Smarkets email and password.' });
      return;
    }

    const session = await createSmarketsSession(credentials.data);
    const factor = session.factor ?? 'complete';
    const needsVerification = session.verify === true || factor !== 'complete';

    if (!session.token) {
      response.status(502).json({ message: 'Smarkets did not return a session token.' });
      return;
    }

    createLocalSession(response, {
      token: session.token,
      expiresAt: session.stop,
      status: needsVerification ? 'pending_verification' : 'authenticated',
    });

    response.status(201).json({
      status: needsVerification ? 'verification_required' : 'authenticated',
      factor,
      expiresAt: session.stop,
      message: needsVerification
        ? 'Smarkets accepted the credentials but requires another verification step.'
        : 'Logged in to Smarkets.',
    });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/session', (request, response) => {
  clearLocalSession(response, getSessionIdFromCookieHeader(request.headers.cookie));
  response.json({
    status: 'anonymous',
    message: 'Logged out of the local Smarkets session.',
  });
});

app.get('/api/events', async (request, response, next) => {
  try {
    const localSession = getRequiredSession(request, response);
    if (!localSession) return;

    const data = await fetchFeaturedEvents(localSession.token, request.query.category);
    response.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/events/:eventId', async (request, response, next) => {
  try {
    const localSession = getRequiredSession(request, response);
    if (!localSession) return;

    const data = await fetchEventDetail(request.params.eventId, localSession.token);
    response.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/quotes', async (request, response, next) => {
  try {
    const localSession = getRequiredSession(request, response);
    if (!localSession) return;

    const data = await fetchMarketQuotes(request.query.marketIds, localSession.token);
    response.json(data);
  } catch (error) {
    next(error);
  }
});

app.use((_request, response) => {
  response.status(404).json({ message: 'Route not found' });
});

app.use((error: unknown, request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    response.status(400).json({ message: 'Invalid login request.' });
    return;
  }

  if (error instanceof SmarketsApiError) {
    if (isSmarketsSessionError(error)) {
      clearLocalSession(response, getSessionIdFromCookieHeader(request.headers.cookie));
    }

    response.status(error.status).json({
      message: error.message,
      errorType: error.errorType,
      retryAfterSeconds: error.retryAfterSeconds,
    });
    return;
  }

  if (error instanceof SmarketsResponseValidationError) {
    response.status(error.status).json({
      message: error.message,
      errorType: error.errorType,
      path: error.path,
      issues: error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    });
    return;
  }

  console.error(error);
  response.status(500).json({ message: 'Unexpected proxy error' });
});

const port = Number(process.env.PORT ?? 8798);
app.listen(port, () => {
  console.log(`Smarkets proxy listening on http://localhost:${port}`);
});
