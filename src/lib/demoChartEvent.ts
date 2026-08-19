import type { ContractQuote, EventSummary } from './schemas';
import type { PriceHistory, PricePoint } from '../types/price';

export const DEMO_EVENT_ID = 'demo-chart-stress';
export const DEMO_MARKET_ID = 'demo-chart-market';
export const DEMO_CONTRACT_IDS = {
  alpha: 'demo-contract-alpha',
  beta: 'demo-contract-beta',
  gamma: 'demo-contract-gamma',
} as const;

const DEMO_POINT_COUNT = 181;
const DEMO_STEP_MS = 20_000;

function createRng(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}

function clampPrice(priceBp: number) {
  return Math.max(700, Math.min(7600, Math.round(priceBp)));
}

function buildCrossingHistory(endTimeMs: number): PriceHistory {
  const rng = createRng(20260819);
  const contractIds = [DEMO_CONTRACT_IDS.alpha, DEMO_CONTRACT_IDS.beta, DEMO_CONTRACT_IDS.gamma];
  const values = [5200, 3100, 1700];
  const history: PriceHistory = {
    [DEMO_CONTRACT_IDS.alpha]: [],
    [DEMO_CONTRACT_IDS.beta]: [],
    [DEMO_CONTRACT_IDS.gamma]: [],
  };

  for (let index = 0; index < DEMO_POINT_COUNT; index += 1) {
    const timestamp = new Date(endTimeMs - (DEMO_POINT_COUNT - 1 - index) * DEMO_STEP_MS).toISOString();
    for (let contractIndex = 0; contractIndex < values.length; contractIndex += 1) {
      values[contractIndex] = clampPrice(values[contractIndex] + (rng() - 0.48) * 980);
    }

    if (rng() < 0.16) {
      const left = Math.floor(rng() * 3);
      const right = Math.floor(rng() * 3);
      const swapped = values[left];
      values[left] = values[right];
      values[right] = swapped;
    }

    contractIds.forEach((contractId, contractIndex) => {
      history[contractId].push({ timestamp, price: values[contractIndex] });
    });
  }

  return history;
}

function quoteFromHistory(contractId: string, points: PricePoint[]): ContractQuote {
  const last = points.at(-1);
  const price = last?.price ?? 5000;
  const spread = 180;

  return {
    contractId,
    bestBackPrice: price,
    bestLayPrice: clampPrice(price + spread),
    lastTradedPrice: price,
    lastTradedAt: last?.timestamp ?? null,
    bids: [
      { price, quantity: 220000 },
      { price: clampPrice(price - 220), quantity: 140000 },
      { price: clampPrice(price - 480), quantity: 80000 },
    ],
    offers: [
      { price: clampPrice(price + spread), quantity: 190000 },
      { price: clampPrice(price + spread + 240), quantity: 110000 },
      { price: clampPrice(price + spread + 520), quantity: 60000 },
    ],
  };
}

export function createDemoChartFixture(endTimeMs = Date.now()) {
  const history = buildCrossingHistory(endTimeMs);
  const event: EventSummary = {
    id: DEMO_EVENT_ID,
    name: 'Chart stress test',
    type: 'DEMO_MARKET',
    state: 'open',
    startDateTime: new Date(endTimeMs).toISOString(),
    markets: [
      {
        id: DEMO_MARKET_ID,
        name: 'Winner',
        state: 'open',
        contracts: [
          { id: DEMO_CONTRACT_IDS.alpha, name: 'Alpha' },
          { id: DEMO_CONTRACT_IDS.beta, name: 'Beta' },
          { id: DEMO_CONTRACT_IDS.gamma, name: 'Gamma' },
        ],
      },
    ],
  };

  const quotes = Object.values(DEMO_CONTRACT_IDS).map((contractId) => quoteFromHistory(contractId, history[contractId]));

  return { event, history, quotes };
}

export const demoChartFixture = createDemoChartFixture();

export function isDemoEventId(eventId: string | null) {
  return eventId === DEMO_EVENT_ID;
}

export function isDemoMarketId(marketId: string) {
  return marketId === DEMO_MARKET_ID;
}
