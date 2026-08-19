# Smarkets Front-End Task

A small React and TypeScript exchange-data interface backed by a minimal backend-for-frontend proxy for the Smarkets API. Users can log in, browse featured events, inspect an event's markets, and see regularly refreshed bid, ask and last-traded prices.

## Why There Is A Proxy

This is still a frontend-focused application. The proxy exists because the Smarkets API is an authenticated third-party API, and a direct browser-only integration creates avoidable problems:

- The Smarkets session token needs to be sent as an `Authorization: Session-Token ...` header. Keeping that detail behind local `/api/*` routes avoids spreading authentication mechanics across UI components.
- Browser CORS rules may block calls to third-party API endpoints from a Vite dev origin, even when server-to-server requests are valid.
- The proxy gives the React app stable, UI-specific DTOs instead of making components depend on raw Smarkets response shapes.
- Errors, rate-limit handling, and quote polling can be normalized in one place.

The proxy is deliberately small. It has no database, user model, or persistence layer; it only adapts Smarkets endpoints for the React app.

## Stack

- React, TypeScript and Vite for the UI.
- Express for the backend-for-frontend proxy.
- React Query for remote state, loading/error states, and later quote polling.
- Zod for validating API responses at the app boundary.
- Vitest, Testing Library, ESLint and Prettier for focused tests and consistent style.

## Running Locally

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5178`

Proxy: `http://localhost:8798`

## Development Stages

Completed:

1. Scaffold React app and proxy health check.
2. Add Smarkets login through the proxy.
3. Restore local session state after browser refresh.
4. Load featured events, markets and contracts.
5. Poll visible market quotes at a controlled interval.
6. Add last-executed prices as a fallback when live books are empty.
7. Add an event detail view with more markets and contracts.
8. Add category tabs for a controlled subset of event types.
9. Add a horizontally scrollable featured-event rail.
10. Add a lightweight price-trend chart from locally observed quote polling.
11. Add focused tests for schemas, formatting helpers, and category filtering.

## Login Flow

The React form posts to `POST /api/session`. The proxy validates the request, calls Smarkets `POST /v3/sessions/`, stores the returned Smarkets token in memory under a local HTTP-only cookie, and returns only a small UI-safe session status.

The browser Network tab can still show the submitted username and password for the login request. That is normal for any browser form because the browser constructs the request. The important security decision is that credentials are not logged, not persisted in local storage, not stored in React Query mutation state, and not returned to the React app after login.

If Smarkets returns `factor: "totp"` or `factor: "nemid"`, the UI shows a verification-required state. The next implementation step can add the matching verification route without changing the React-to-proxy boundary.

`GET /api/session` lets the React app restore a local session after a browser refresh. In development, sessions are intentionally stored in memory only, so changing server files and restarting `tsx watch` clears them. Persisting Smarkets tokens to disk would be unnecessary and less safe for this take-home task.

## API Boundaries

The code keeps two explicit API boundaries:

- `src/lib/api.ts` is the browser-side API client. Components call named functions such as `login()` and `fetchHealth()` instead of using raw `fetch`, so loading/error handling stays consistent.
- `server/smarketsClient.ts` is the Smarkets boundary. It owns the base URL, headers, `Session-Token` formatting, JSON parsing, response validation, and Smarkets error translation.

The Express routes sit between those two boundaries. They should stay thin: validate request data, call the Smarkets client, store or retrieve the local session, and return UI-specific responses.

## Homepage Data Flow

`GET /api/events` follows the Smarkets hierarchy:

1. `GET /v3/events/` retrieves upcoming events.
2. `GET /v3/events/{event_ids}/markets/` retrieves markets for those events.
3. `GET /v3/markets/{market_ids}/contracts/` retrieves the contracts available in the visible markets.

The proxy maps those raw responses into `EventSummary`, `MarketSummary`, and `ContractSummary` objects. That keeps the React homepage independent from Smarkets field names such as `start_datetime` and `event_id`.

The homepage accepts a category query, for example `GET /api/events?category=football`. The proxy fetches a larger upcoming sample, filters by Smarkets event slug/type, fetches markets and contracts, then returns the first useful events with available markets. The current UI exposes eight tabs: All, Football, Horse Racing, Greyhound Racing, Tennis, Basketball, Baseball and Politics. This avoids dumping every Smarkets event into the UI and keeps request volume controlled.

The category filter is intentionally server-side because it is part of the Smarkets adaptation layer. The React app only asks for a category by name; it does not need to know which raw Smarkets fields currently identify football, tennis or racing events.

## Event Details

Clicking an event calls `GET /api/events/:eventId`. The proxy fetches:

1. `GET /v3/events/{event_id}/`
2. `GET /v3/events/{event_id}/markets/`
3. `GET /v3/markets/{market_ids}/contracts/`

The detail view reuses the same UI models as the homepage, but it does not apply the homepage market limit. This keeps the feature small while satisfying the requirement that a user can click into an event to see more available markets.

## Prices

The public Smarkets API exposes prices through HTTP endpoints rather than a documented WebSocket subscription endpoint. The app therefore uses React Query polling for visible markets.

Smarkets prices are percentage basis points, not decimal odds. The OpenAPI example is `5000 = 50%` implied probability; decimal odds are `10000 / price` (`10000 / 5000 = 2.00`). Order-book quantity is `1/100` of a UK penny; back stake in GBP is `quantity * price / 100000000`. Display conversion lives in `src/lib/price.ts` so percent, decimal and American formats share one source of truth.

The proxy batches visible market IDs (up to 72, covering the homepage 24 events × 3 markets) into:

1. `GET /v3/markets/{market_ids}/quotes/` for current bid and ask books.
2. `GET /v3/markets/{market_ids}/last_executed_prices/` for a fallback last-traded price.

The UI shows `--` when Smarkets returns no value for a bid, ask or last-traded price. Empty cells are expected for markets without current liquidity. Category is kept on the query string (`/?category=football`) so a refresh does not drop the selected sport. Price buttons are labelled Buy and Sell for scanability: Buy is the best back price (bids) and Sell is the best lay price (offers).

The small trend chart is built from prices observed while the app is open, plotted on a shared timestamp axis. It is not a claim to have official historical odds data; it is a UI enhancement on top of the public polling endpoints. I avoided using Smarkets website GraphQL calls because the provided task API is the documented OpenAPI/REST surface, and depending on an undocumented internal website API would be brittle.

## Smarkets API Notes

- Login uses `POST /v3/sessions/` with `username` and `password`.
- Authenticated calls use `Authorization: Session-Token <token>`.
- Login attempts are rate-limited, so the proxy surfaces Smarkets rate-limit errors and reset timing when available.
- Event sorting requires compound values such as `sort=start_datetime,id`; `sort=start_datetime` is rejected.
- Raw response fields can be nullable even when they look like display strings, so the raw Smarkets schemas deliberately tolerate `null`.
- Sessions are stored in memory only. Browser refresh can restore the session from the local cookie while the proxy is still running, but server restarts clear the in-memory token.
- API responses are marked `Cache-Control: no-store`, the Express JSON body limit is kept small, and the local session cookie is HTTP-only with `secure` enabled in production.

## Tradeoffs

- The proxy is intentionally not a full backend. It has no database and no user model; it only adapts Smarkets for the UI.
- Polling is used because no public WebSocket market-data endpoint is documented. The UI is kept decoupled through `fetchMarketQuotes()`, so a streaming source could replace polling later.
- Smarkets quote books can be empty. Last-executed prices improve the display, but they are not the same as live tradable liquidity.
- Category matching is based on observed Smarkets slug/type conventions. In a production integration, I would prefer a documented taxonomy endpoint or a maintained mapping from Smarkets.

## Testing

```bash
npm test
npm run lint
npm run build
```

The tests focus on code owned by this project: response schemas, OpenAPI price conversion, quote mapping, display formatting, and category filtering. They avoid live Smarkets calls so the suite remains deterministic and does not consume login or rate-limit budget.
