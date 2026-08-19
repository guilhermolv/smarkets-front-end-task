import { formatPrice } from '../../lib/format';
import type { PriceFormat, PricePoint } from '../../types/price';

type LegendRow = {
  id: string;
  name: string;
  colour: string;
  point: PricePoint;
};

type PriceTrendLegendProps = {
  hoverTimeLabel: string;
  hoverTimestamp?: string;
  isHovering: boolean;
  priceFormat: PriceFormat;
  rows: LegendRow[];
};

export function PriceTrendLegend({ hoverTimeLabel, hoverTimestamp, isHovering, priceFormat, rows }: PriceTrendLegendProps) {
  return (
    <div className="price-trend-legend" aria-live="polite">
      <time dateTime={hoverTimestamp}>
        {hoverTimeLabel}
        {isHovering ? null : <span>Latest</span>}
      </time>
      {rows.map((row) => (
        <span className="price-trend-legend-series" key={row.id}>
          <span aria-hidden="true" className="price-trend-swatch" style={{ background: row.colour }} />
          <em>{row.name}</em>
          <b>{formatPrice(row.point.price, '--', priceFormat)}</b>
        </span>
      ))}
    </div>
  );
}
