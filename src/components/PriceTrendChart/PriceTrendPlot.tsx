import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { formatChartScrubLabel, formatChartTime } from '../../lib/format';
import { plotLayout, trackLabelsFitOnRight } from '../../lib/priceTrend';
import type { PricePoint } from '../../types/price';

type PlotSeries = {
  id: string;
  colour: string;
  d: string;
};

type HoverRow = {
  id: string;
  colour: string;
  point: PricePoint;
};

type TrackLabel = {
  id: string;
  name: string;
  colour: string;
  priceLabel: string;
  y: number;
};

type PriceTrendPlotProps = {
  firstTimestamp?: string;
  hoverRows: HoverRow[];
  hoverTimestamp?: string;
  isHovering: boolean;
  lastTimestamp?: string;
  paths: PlotSeries[];
  sampledX: number;
  trackLabels: TrackLabel[];
  yAxisTicks: Array<{ label: string; y: number }>;
  yForPrice: (price: number) => number;
  onPointerLeave: () => void;
  onPointerMove: (clientX: number, left: number, width: number) => void;
  onStep: (delta: number) => void;
  onClearHover: () => void;
};

const markerPx = 5;

export function PriceTrendPlot({
  firstTimestamp,
  hoverRows,
  hoverTimestamp,
  isHovering,
  lastTimestamp,
  paths,
  sampledX,
  trackLabels,
  yAxisTicks,
  yForPrice,
  onPointerLeave,
  onPointerMove,
  onStep,
  onClearHover,
}: PriceTrendPlotProps) {
  const clipId = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewSize, setViewSize] = useState({ width: 100, height: 96 });

  useLayoutEffect(() => {
    const node = svgRef.current;
    if (!node) return;

    function measure(element: SVGSVGElement) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewSize({ width: rect.width, height: rect.height });
      }
    }

    measure(node);
    const observer = new ResizeObserver(() => measure(node));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const markerRx = (markerPx * 100) / viewSize.width;
  const markerRy = (markerPx * plotLayout.plotHeight) / viewSize.height;
  const labelsFitOnRight = trackLabelsFitOnRight(sampledX);
  const pastClipId = `${clipId}-past`;
  const futureClipId = `${clipId}-future`;

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    onPointerMove(event.clientX, bounds.left, bounds.width);
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onStep(-1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onStep(1);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onClearHover();
    }
  }

  const seriesPaths = paths.map((item) => <path d={item.d} key={item.id} stroke={item.colour} />);

  return (
    <div className="price-trend-stage">
      <svg
        ref={svgRef}
        aria-label="Price trend. Use left and right arrows to inspect times."
        onKeyDown={handleKeyDown}
        onPointerLeave={onPointerLeave}
        onPointerMove={handlePointerMove}
        preserveAspectRatio="none"
        role="img"
        tabIndex={0}
        viewBox={`0 0 100 ${plotLayout.plotHeight}`}
      >
        <defs>
          <clipPath id={pastClipId}>
            <rect height={plotLayout.plotHeight} width={sampledX} x="0" y="0" />
          </clipPath>
          <clipPath id={futureClipId}>
            <rect height={plotLayout.plotHeight} width={100 - sampledX} x={sampledX} y="0" />
          </clipPath>
        </defs>
        {yAxisTicks.map((tick) => (
          <line
            className="price-trend-grid-line"
            key={`grid-${tick.y}`}
            x1={plotLayout.plotStartX}
            x2={plotLayout.axisX}
            y1={tick.y}
            y2={tick.y}
          />
        ))}
        {isHovering ? (
          <>
            <g clipPath={`url(#${pastClipId})`}>{seriesPaths}</g>
            <g className="price-trend-future" clipPath={`url(#${futureClipId})`}>
              {seriesPaths}
            </g>
          </>
        ) : (
          seriesPaths
        )}
        {isHovering ? (
          <line className="price-trend-crosshair" x1={sampledX} x2={sampledX} y1={plotLayout.plotTopY} y2={plotLayout.plotBottomY} />
        ) : null}
        {hoverRows.map((row) => (
          <ellipse
            cx={sampledX}
            cy={yForPrice(row.point.price)}
            fill={row.colour}
            key={row.id}
            opacity={isHovering ? 1 : 0.92}
            rx={markerRx}
            ry={markerRy}
          />
        ))}
      </svg>
      <div className="price-trend-y-labels">
        {yAxisTicks.map((tick) => (
          <span key={`${tick.label}-${tick.y}`} style={{ top: `${(tick.y / plotLayout.plotHeight) * 100}%` }}>
            {tick.label}
          </span>
        ))}
      </div>
      {firstTimestamp ? <span className="price-trend-x-label price-trend-x-label-start">{formatChartTime(firstTimestamp)}</span> : null}
      {lastTimestamp ? (
        <span className="price-trend-x-label price-trend-x-label-end" style={{ left: `${plotLayout.plotEndX}%` }}>
          {formatChartTime(lastTimestamp)}
        </span>
      ) : null}
      {isHovering ? (
        <>
          <span className="price-trend-scrub-time" style={{ left: `${sampledX}%` }}>
            {formatChartScrubLabel(hoverTimestamp)}
          </span>
          {trackLabels.map((label) => (
            <span
              className={labelsFitOnRight ? 'price-trend-track-label' : 'price-trend-track-label price-trend-track-label-left'}
              key={label.id}
              style={{ color: label.colour, left: `${sampledX}%`, top: `${(label.y / plotLayout.plotHeight) * 100}%` }}
            >
              {label.name} {label.priceLabel}
            </span>
          ))}
        </>
      ) : null}
    </div>
  );
}
