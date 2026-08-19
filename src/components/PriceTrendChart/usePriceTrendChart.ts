import { useMemo, useState } from 'react';
import { formatChartTime, formatPrice } from '../../lib/format';
import {
  numericPlotValue,
  paddedDomain,
  placeTrackLabels,
  plotLayout,
  pointAtOrBefore,
  pointerXFromClient,
  seriesPath,
  sortPricePoints,
  stepHoverX,
  timestampIndexForX,
  uniqueTimestamps,
  xForIndex,
  yAxisTicks,
  yForPlotValue,
  type TrendSeries,
} from '../../lib/priceTrend';
import type { ContractSummary } from '../../lib/schemas';
import type { PriceFormat, PriceHistory } from '../../types/price';

const seriesColours = ['var(--trend-1, #10b981)', 'var(--trend-2, #3b82f6)', 'var(--trend-3, #8b5cf6)'];

type UsePriceTrendChartArgs = {
  contracts: ContractSummary[];
  history: PriceHistory;
  priceFormat: PriceFormat;
};

export function usePriceTrendChart({ contracts, history, priceFormat }: UsePriceTrendChartArgs) {
  const [hoverX, setHoverX] = useState<number | null>(null);

  const series = useMemo<TrendSeries[]>(
    () =>
      contracts
        .slice(0, 3)
        .map((contract, index) => ({
          id: contract.id,
          name: contract.name,
          colour: seriesColours[index],
          points: sortPricePoints(history[contract.id] ?? []),
        }))
        .filter((item) => item.points.length > 1),
    [contracts, history],
  );

  const values = useMemo(
    () => series.flatMap((item) => item.points.map((point) => numericPlotValue(point.price, priceFormat))),
    [priceFormat, series],
  );

  const domain = useMemo(() => (values.length < 2 ? null : paddedDomain(values)), [values]);
  const timeline = useMemo(() => uniqueTimestamps(series), [series]);

  const yForPrice = (price: number) => {
    if (!domain) return plotLayout.plotBottomY;
    return yForPlotValue(numericPlotValue(price, priceFormat), domain.min, domain.range);
  };

  const hoverIndex = timestampIndexForX(hoverX, timeline.length);
  const hoverTimestamp = timeline[hoverIndex] ?? series[0]?.points.at(-1)?.timestamp;
  const hoverRows = series.map((item) => ({
    ...item,
    point: pointAtOrBefore(item.points, hoverTimestamp ?? item.points.at(-1)!.timestamp),
  }));
  const sampledX = xForIndex(hoverIndex, timeline.length);
  const isHovering = hoverX !== null;

  return {
    ready: values.length >= 2 && domain !== null,
    paths: series.map((item) => ({ id: item.id, colour: item.colour, d: seriesPath(item.points, timeline, yForPrice) })),
    hoverRows,
    yAxisTicks: domain ? yAxisTicks(domain.min, domain.max, priceFormat) : [],
    firstTimestamp: timeline[0],
    lastTimestamp: timeline.at(-1),
    hoverTimestamp,
    hoverTimeLabel: formatChartTime(hoverTimestamp),
    sampledX,
    isHovering,
    yForPrice,
    trackLabels: placeTrackLabels(
      hoverRows.map((row) => ({
        id: row.id,
        name: row.name,
        colour: row.colour,
        priceLabel: formatPrice(row.point.price, '--', priceFormat),
        y: yForPrice(row.point.price),
      })),
    ),
    onPointerMove(clientX: number, left: number, width: number) {
      setHoverX(pointerXFromClient(clientX, left, width));
    },
    onPointerLeave() {
      setHoverX(null);
    },
    onStep(delta: number) {
      setHoverX((currentHoverX) => stepHoverX(currentHoverX, timeline.length, delta));
    },
    clearHover() {
      setHoverX(null);
    },
  };
}
