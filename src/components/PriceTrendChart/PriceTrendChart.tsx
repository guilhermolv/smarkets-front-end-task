import { PointerEvent, useState } from 'react';
import { formatPercentPrice } from '../../lib/format';
import type { ContractSummary } from '../../lib/schemas';
import type { PriceHistory, PricePoint } from '../../types/price';
import './PriceTrendChart.scss';

type PriceTrendChartProps = {
  contracts: ContractSummary[];
  history: PriceHistory;
};

export function PriceTrendChart({ contracts, history }: PriceTrendChartProps) {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const colours = ['#10b981', '#3b82f6', '#8b5cf6'];
  const plotStartX = 0;
  const plotEndX = 68;
  const plotWidth = plotEndX - plotStartX;
  const series = contracts
    .slice(0, 3)
    .map((contract, index) => ({
      contract,
      colour: colours[index],
      points: history[contract.id] ?? [],
    }))
    .filter((item) => item.points.length > 1);
  const values = series.flatMap((item) => item.points.map((point) => point.price));

  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const longestSeriesLength = Math.max(...series.map((item) => item.points.length));
  const yForPrice = (price: number) => 36 - ((price - min) / range) * 30;
  const hoverIndex =
    hoverX === null
      ? longestSeriesLength - 1
      : Math.max(
          0,
          Math.min(longestSeriesLength - 1, Math.round(((Math.min(Math.max(hoverX, plotStartX), plotEndX) - plotStartX) / plotWidth) * (longestSeriesLength - 1))),
        );
  const hoverTimestamp = series.find((item) => item.points[hoverIndex])?.points[hoverIndex]?.timestamp ?? series[0].points.at(-1)?.timestamp;
  const hoverRows = series.map((item) => {
    const point = item.points[Math.min(hoverIndex, item.points.length - 1)];
    return { ...item, point };
  });
  const sortedHoverRows = [...hoverRows].sort((left, right) => right.point.price - left.point.price);
  const labelPlacements = (() => {
    const minLabelY = 10;
    const maxLabelY = 34;
    const labelGap = 8;
    let placements = sortedHoverRows
      .map((item) => ({
        ...item,
        y: Math.max(minLabelY, Math.min(maxLabelY, yForPrice(item.point.price))),
      }))
      .sort((left, right) => left.y - right.y);

    for (let index = 1; index < placements.length; index += 1) {
      placements[index] = {
        ...placements[index],
        y: Math.max(placements[index].y, placements[index - 1].y + labelGap),
      };
    }

    const overflow = placements.at(-1) ? placements.at(-1)!.y - maxLabelY : 0;
    if (overflow > 0) {
      placements = placements.map((placement) => ({ ...placement, y: placement.y - overflow }));
    }

    for (let index = placements.length - 2; index >= 0; index -= 1) {
      placements[index] = {
        ...placements[index],
        y: Math.min(placements[index].y, placements[index + 1].y - labelGap),
      };
    }

    const underflow = placements[0] ? minLabelY - placements[0].y : 0;
    if (underflow > 0) {
      placements = placements.map((placement) => ({ ...placement, y: placement.y + underflow }));
    }

    return placements;
  })();
  const sampledX = longestSeriesLength === 1 ? plotStartX : plotStartX + (hoverIndex / (longestSeriesLength - 1)) * plotWidth;
  const guideX = hoverX === null ? plotEndX : Math.min(Math.max(hoverX, plotStartX), plotEndX);

  function pathFor(points: PricePoint[]) {
    return points
      .map((point, index) => {
        const x = points.length === 1 ? plotStartX : plotStartX + (index / (points.length - 1)) * plotWidth;
        const y = 36 - ((point.price - min) / range) * 30;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const nextHoverX = ((event.clientX - bounds.left) / bounds.width) * 100;
    setHoverX(Math.max(plotStartX, Math.min(plotEndX, nextHoverX)));
  }

  return (
    <div className="price-trend" aria-label="Polled price trend">
      <div className="price-trend-stage">
        <svg
          onPointerLeave={() => {
            setHoverX(null);
          }}
          onPointerMove={handlePointerMove}
          preserveAspectRatio="none"
          role="img"
          tabIndex={0}
          viewBox="0 0 100 40"
        >
          <line x1="0" x2="100" y1="6" y2="6" />
          <line x1="0" x2="100" y1="20" y2="20" />
          <line x1="0" x2="100" y1="34" y2="34" />
          {series.map((item) => (
            <path d={pathFor(item.points)} key={item.contract.id} stroke={item.colour} />
          ))}
          {hoverX !== null ? (
            <>
              {hoverRows.map(({ contract, colour, point }) => {
                const x = sampledX;
                const y = yForPrice(point.price);

                return <circle cx={x} cy={y} fill={colour} key={contract.id} r="1.4" />;
              })}
            </>
          ) : null}
        </svg>
        {hoverX !== null ? <span className="price-trend-guide-overlay" style={{ left: `${guideX}%` }} /> : null}
        <div className={hoverX === null ? 'price-trend-readout price-trend-readout-latest' : 'price-trend-readout'} style={{ left: `${guideX}%` }}>
          <strong>{hoverTimestamp ? new Date(hoverTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Latest'}</strong>
          {labelPlacements.map(({ contract, colour, point, y }) => (
            <span key={contract.id} style={{ color: colour, top: `${(y / 40) * 100}%` }}>
              <em>{contract.name}</em>
              <b>{formatPercentPrice(point.price)}</b>
            </span>
          ))}
        </div>
      </div>
      <div className="price-trend-legend">
        {series.map((item) => (
          <span key={item.contract.id}>
            <i style={{ background: item.colour }} />
            {item.contract.name}
          </span>
        ))}
      </div>
    </div>
  );
}
