import { describe, expect, it } from 'vitest';
import { createDemoChartFixture, DEMO_CONTRACT_IDS, DEMO_EVENT_ID } from './demoChartEvent';

describe('demo chart fixture', () => {
  const fixture = createDemoChartFixture(Date.parse('2026-08-19T16:00:00Z'));
  const alpha = fixture.history[DEMO_CONTRACT_IDS.alpha];
  const beta = fixture.history[DEMO_CONTRACT_IDS.beta];
  const gamma = fixture.history[DEMO_CONTRACT_IDS.gamma];

  it('builds a three-way market for the homepage stress event', () => {
    expect(fixture.event.id).toBe(DEMO_EVENT_ID);
    expect(fixture.event.markets[0].contracts.map((contract) => contract.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(fixture.quotes).toHaveLength(3);
  });

  it('covers about an hour with dense crossing samples', () => {
    expect(alpha.length).toBeGreaterThan(120);
    expect(beta).toHaveLength(alpha.length);
    expect(gamma).toHaveLength(alpha.length);

    const spanMs = Date.parse(alpha.at(-1)!.timestamp) - Date.parse(alpha[0].timestamp);
    expect(spanMs).toBeGreaterThanOrEqual(60 * 60 * 1000 - 20_000);

    const alphaLeads = alpha.filter((point, index) => point.price >= beta[index].price && point.price >= gamma[index].price).length;
    expect(alphaLeads).toBeGreaterThan(0);
    expect(alphaLeads).toBeLessThan(alpha.length);
  });
});
