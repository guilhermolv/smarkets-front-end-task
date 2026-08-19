import { describe, expect, it } from 'vitest';
import {
  paddedDomain,
  pointAtOrBefore,
  pointerXFromClient,
  placeTrackLabels,
  plotLayout,
  seriesPath,
  stepHoverX,
  timestampIndexForX,
  trackLabelsOnLeft,
  uniqueTimestamps,
  xForIndex,
} from './priceTrend';

describe('price trend timeline', () => {
  it('builds a shared sorted timestamp axis', () => {
    expect(
      uniqueTimestamps([
        {
          points: [
            { timestamp: '2026-08-15T09:02:00Z', price: 4000 },
            { timestamp: '2026-08-15T09:00:00Z', price: 4100 },
          ],
        },
        { points: [{ timestamp: '2026-08-15T09:00:00Z', price: 5000 }] },
      ]),
    ).toEqual(['2026-08-15T09:00:00Z', '2026-08-15T09:02:00Z']);
  });

  it('maps hover X to the nearest shared timestamp index', () => {
    expect(timestampIndexForX(null, 4)).toBe(3);
    expect(timestampIndexForX(3, 5)).toBe(0);
    expect(timestampIndexForX(82, 5)).toBe(4);
  });

  it('uses the last known point at or before the hovered timestamp', () => {
    const points = [
      { timestamp: '2026-08-15T09:00:00Z', price: 4000 },
      { timestamp: '2026-08-15T09:02:00Z', price: 4100 },
    ];

    expect(pointAtOrBefore(points, '2026-08-15T09:02:00Z')?.price).toBe(4100);
    expect(pointAtOrBefore(points, '2026-08-15T09:01:00Z')?.price).toBe(4000);
    expect(xForIndex(0, 1)).toBe(3);
  });

  it('draws a series from left to right even when points arrive out of order', () => {
    const path = seriesPath(
      [
        { timestamp: '2026-08-15T09:04:00Z', price: 4000 },
        { timestamp: '2026-08-15T09:00:00Z', price: 4100 },
        { timestamp: '2026-08-15T09:02:00Z', price: 4050 },
      ],
      ['2026-08-15T09:00:00Z', '2026-08-15T09:02:00Z', '2026-08-15T09:04:00Z'],
      () => 50,
    );
    const xs = [...path.matchAll(/[ML] ([\d.]+)/g)].map((match) => Number(match[1]));

    expect(xs).toHaveLength(3);
    expect(xs[0]).toBeLessThan(xs[1]);
    expect(xs[1]).toBeLessThan(xs[2]);
  });
});

describe('price trend scale', () => {
  it('pads the y-domain so series do not sit on the plot edge', () => {
    const domain = paddedDomain([10, 20]);
    expect(domain.min).toBeLessThan(10);
    expect(domain.max).toBeGreaterThan(20);
    expect(domain.range).toBeCloseTo(11.6);
  });

  it('clamps pointer X to the plot and steps along the timeline', () => {
    expect(pointerXFromClient(0, 0, 100)).toBe(plotLayout.plotStartX);
    expect(pointerXFromClient(100, 0, 100)).toBe(plotLayout.plotEndX);
    expect(stepHoverX(plotLayout.plotStartX, 5, 1)).toBe(xForIndex(1, 5));
    expect(trackLabelsOnLeft(plotLayout.plotStartX)).toBe(false);
    expect(trackLabelsOnLeft(plotLayout.plotEndX)).toBe(true);
  });

  it('keeps track labels spaced so they do not sit on top of each other', () => {
    const placements = placeTrackLabels([{ y: 20 }, { y: 21 }, { y: 22 }]);
    expect(placements[1].y - placements[0].y).toBeGreaterThanOrEqual(8);
    expect(placements[2].y - placements[1].y).toBeGreaterThanOrEqual(8);
  });
});
