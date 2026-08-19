# Smarkets Front-End Task

A React exchange explorer for a Smarkets account: log in, browse upcoming events by category, open an event for more markets, and watch bid, ask and last-traded prices refresh.

This is a frontend exercise. A small Express proxy sits in front of the Smarkets API so the browser never holds a `Session-Token`, never fights CORS from the Vite origin, and never depends on raw Smarkets field names.

## Running locally

```bash
npm install
npm run dev
```

- UI: `http://localhost:5178`
- Proxy: `http://localhost:8798`

```bash
npm test
npm run lint
npm run build
```

## Choices

The brief required React and allowed any other tools, with a six-hour cap. I picked a small stack I could justify and finish.

| Choice | Why |
| --- | --- |
| TypeScript + Vite | Fast local loop, typed UI models, and a production build the reviewer can run. |
| Express BFF | Smarkets auth is a session token in `Authorization`. Putting that behind `/api/*` keeps components on UI DTOs and avoids leaking the token into `localStorage` or React Query. |
| TanStack Query | Server state, login restore, loading/error, and 5s quote polling without Redux. A streaming source could replace `fetchMarketQuotes()` later. |
| Zod | Validate at both edges: proxy responses in the browser, raw Smarkets payloads on the server. Components do not parse JSON. |
| Custom `history.pushState` | Two routes (`/` and `/events/:id`) plus `?category=`. A router library would be extra surface for this size. |
| Custom SVG trend chart | The public API has no official OHLC history. The chart is locally observed poll samples, so a chart library would over-claim. |
| Vitest | One file of conversion tests. No live Smarkets calls, so the suite stays deterministic and does not spend login or rate-limit budget. |
| Sass | Shared tokens for dark/light, Buy/Sell colour, and layout without a UI kit. |

I did not add React Router, Redux, WebSockets, or a database. None of those were required to meet the brief, and each would have used time better spent on login, prices and the event page.

## Technical decisions

**Session.** `POST /api/session` calls Smarkets `POST /v3/sessions/`, stores the token in memory, and sets an HTTP-only cookie. The React app only sees `{ status, factor, expiresAt, message }`. Credentials are not kept in mutation cache (`gcTime: 0`). TOTP / NemID is detected as `verification_required` and not completed; the React-to-proxy boundary can add a verify route later without changing the UI models.

**Homepage vs event page.** Featured events are capped (24 events, 3 markets) so quote batches stay inside a 72-id limit. Opening an event loads the rest of that event's markets, with load-more and a toggle for unpriced markets. Category matching (`football`, racing, tennis, …) stays on the server because it is Smarkets slug/type adaptation, not UI logic.

**Prices.** The public API is HTTP quotes, not a documented WebSocket, so the UI polls. Smarkets prices are percentage basis points (`5000` = 50% = 2.00 decimal). Quantity is `1/100` of a UK penny; back stake is `quantity * price / 100000000`. Empty books are common, so last-executed prices fill the display without pretending they are live liquidity. Buy is best back (bids); Sell is best lay (offers). `--` means Smarkets returned no value.

**Trend chart.** Built from prices seen while the page is open. It is not official historical odds. Graph and order book stay collapsed until opened so an event with many markets does not mount a chart per row.

## Challenges

The main time sinks were API shape, not React scaffolding.

- Quote books are often empty. Last-executed prices make the homepage usable, but they are a different product concept from a live book.
- Price units are easy to get wrong. Treating basis points as decimal odds, or quantity as pounds, produces confident-looking nonsense. Conversion lives in `src/lib/price.ts` and is what the tests lock.
- Event sort requires `sort=start_datetime,id`; `sort=start_datetime` is rejected.
- Login is rate-limited. The proxy surfaces that instead of retrying aggressively.
- Category taxonomy is observed slug/type conventions, not a documented endpoint.
- In-memory sessions die when the proxy restarts. That is acceptable here; disk-persisting Smarkets tokens would be worse for a take-home.

## If I had more time

- **Tests.** This submission only covers OpenAPI price and stake conversion. With more time I would add tests for quote mapping (best bid/offer, last-executed merge), category filtering, URL navigation, login error copy, market-order freeze, and the chart's "needs two samples" empty state. I would still avoid hitting the live Smarkets API in CI.
- Complete TOTP / NemID verification against the existing session status.
- Documented event taxonomy if Smarkets expose one, instead of slug matchers.
- Replace polling with a stream if a public market-data socket appears; the UI already goes through `fetchMarketQuotes()`.
- Stronger settings keyboard support (native selects or a full listbox), and a persisted price-format preference.
- A production session store with expiry and rotation, instead of a process-local `Map`.

## Layout of the code

- `src/lib/api.ts` — browser client. Named functions, Zod, `ApiRequestError`.
- `src/lib/price.ts` — basis points, odds formats, GBP stake.
- `src/hooks/` — auth, theme, custom routing, events + 5s quotes, local price history.
- `src/components/` — shell, login, events, prices, optional graph/book.
- `server/smarketsClient.ts` — base URL, `Session-Token`, Zod, rate-limit errors.
- `server/marketData.ts` / `server/quotes.ts` — featured events, detail, batched quotes.
- `server/sessionStore.ts` — cookie to in-memory Smarkets token.
