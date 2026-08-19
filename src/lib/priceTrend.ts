import type { PriceFormat } from '../types/price';
import type { PricePoint } from '../types/price';
import { plotValue } from './price';

export const plotLayout = {
  plotHeight: 96,
  plotStartX: 3,
  axisX: 98.5,
  plotEndX: 82,
  yAxisStartX: 88,
  plotTopY: 8,
  plotBottomY: 86,
  yAxisTickCount: 6,
  domainPaddingRatio: 0.08,
  minTrackLabelWidth: 20,
};

export const plotWidth = plotLayout.plotEndX - plotLayout.plotStartX;

export type TrendSeries = {
  id: string;
  name: string;
  colour: string;
  points: PricePoint[];
};

export function uniqueTimestamps(series: Array<{ points: PricePoint[] }>) {
  return [...new Set(series.flatMap((item) => item.points.map((point) => point.timestamp)))].sort(compareTimestamps);
}

export function sortPricePoints(points: PricePoint[]) {
  return [...points].sort((left, right) => compareTimestamps(left.timestamp, right.timestamp));
}

function compareTimestamps(left: string, right: string) {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return left.localeCompare(right);
}

export function xForIndex(index: number, count: number) {
  if (count <= 1) return plotLayout.plotStartX;
  return plotLayout.plotStartX + (index / (count - 1)) * plotWidth;
}

export function timestampIndexForX(hoverX: number | null, timestampCount: number) {
  if (timestampCount === 0) return 0;
  if (hoverX === null) return timestampCount - 1;

  const clampedX = Math.min(Math.max(hoverX, plotLayout.plotStartX), plotLayout.plotEndX);
  return Math.max(0, Math.min(timestampCount - 1, Math.round(((clampedX - plotLayout.plotStartX) / plotWidth) * (timestampCount - 1))));
}

export function pointAtOrBefore(points: PricePoint[], timestamp: string) {
  const exact = points.find((point) => point.timestamp === timestamp);
  if (exact) return exact;

  const earlier = [...points].reverse().find((point) => point.timestamp <= timestamp);
  return earlier ?? points[0];
}

export function formatPlotValue(value: number, format: PriceFormat) {
  if (format === 'percent') return `${value.toFixed(2)}%`;
  if (format === 'american') {
    const rounded = Math.round(value);
    return rounded > 0 ? `+${rounded}` : `${rounded}`;
  }
  return value.toFixed(2);
}

export function numericPlotValue(priceBp: number, format: PriceFormat) {
  return plotValue(priceBp, format) ?? 0;
}

export function paddedDomain(values: number[], paddingRatio = plotLayout.domainPaddingRatio) {
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const span = maxValue - minValue || Math.abs(minValue) * 0.1 || 1;
  const pad = span * paddingRatio;

  return {
    min: minValue - pad,
    max: maxValue + pad,
    range: span + pad * 2,
  };
}

export function yForPlotValue(value: number, min: number, range: number) {
  return plotLayout.plotBottomY - ((value - min) / range) * (plotLayout.plotBottomY - plotLayout.plotTopY);
}

export function plotValueForY(y: number, min: number, max: number) {
  return max - ((y - plotLayout.plotTopY) / (plotLayout.plotBottomY - plotLayout.plotTopY)) * (max - min);
}

export function yAxisTicks(min: number, max: number, format: PriceFormat) {
  return Array.from({ length: plotLayout.yAxisTickCount }, (_, index) => {
    const y = plotLayout.plotTopY + ((plotLayout.plotBottomY - plotLayout.plotTopY) / (plotLayout.yAxisTickCount - 1)) * index;
    return { label: formatPlotValue(plotValueForY(y, min, max), format), y };
  });
}

export function seriesPath(points: PricePoint[], timeline: string[], yForPrice: (price: number) => number) {
  const indexByTimestamp = new Map(timeline.map((timestamp, index) => [timestamp, index]));

  return sortPricePoints(points)
    .filter((point) => indexByTimestamp.has(point.timestamp))
    .map((point, index) => {
      const x = xForIndex(indexByTimestamp.get(point.timestamp) ?? 0, timeline.length);
      const y = yForPrice(point.price);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

export function pointerXFromClient(clientX: number, left: number, width: number) {
  if (width <= 0) return plotLayout.plotStartX;
  const nextHoverX = ((clientX - left) / width) * 100;
  return Math.max(plotLayout.plotStartX, Math.min(plotLayout.plotEndX, nextHoverX));
}

export function stepHoverX(hoverX: number | null, timestampCount: number, delta: number) {
  if (timestampCount === 0) return hoverX;
  const currentIndex = timestampIndexForX(hoverX, timestampCount);
  const nextIndex = Math.max(0, Math.min(timestampCount - 1, currentIndex + delta));
  return xForIndex(nextIndex, timestampCount);
}

export function trackLabelsFitOnRight(sampledX: number) {
  return sampledX + plotLayout.minTrackLabelWidth <= plotLayout.yAxisStartX;
}

export function placeTrackLabels<T extends { y: number }>(items: T[]) {
  const minY = plotLayout.plotTopY + 10;
  const maxY = plotLayout.plotBottomY - 4;
  const gap = 8;
  let placements = [...items]
    .sort((left, right) => left.y - right.y)
    .map((item) => ({ ...item, y: Math.max(minY, Math.min(maxY, item.y)) }));

  for (let index = 1; index < placements.length; index += 1) {
    placements[index] = {
      ...placements[index],
      y: Math.max(placements[index].y, placements[index - 1].y + gap),
    };
  }

  const overflow = (placements.at(-1)?.y ?? 0) - maxY;
  if (overflow > 0) {
    placements = placements.map((placement) => ({ ...placement, y: placement.y - overflow }));
  }

  for (let index = placements.length - 2; index >= 0; index -= 1) {
    placements[index] = {
      ...placements[index],
      y: Math.min(placements[index].y, placements[index + 1].y - gap),
    };
  }

  return placements;
}
