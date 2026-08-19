import { usePriceDisplay } from '../../context/PriceDisplayContext';
import type { ContractSummary } from '../../lib/schemas';
import type { PriceHistory } from '../../types/price';
import { PriceTrendLegend } from './PriceTrendLegend';
import { PriceTrendPlot } from './PriceTrendPlot';
import { usePriceTrendChart } from './usePriceTrendChart';
import './PriceTrendChart.scss';

type PriceTrendChartProps = {
  contracts: ContractSummary[];
  history: PriceHistory;
};

export function PriceTrendChart({ contracts, history }: PriceTrendChartProps) {
  const { priceFormat } = usePriceDisplay();
  const chart = usePriceTrendChart({ contracts, history, priceFormat });

  if (!chart.ready) {
    return (
      <p className="price-trend-pending">
        Price trend appears after the next refresh. The chart is built from prices seen while this page is open.
      </p>
    );
  }

  return (
    <div className="price-trend" aria-label="Polled price trend">
      <PriceTrendLegend
        hoverTimeLabel={chart.hoverTimeLabel}
        hoverTimestamp={chart.hoverTimestamp}
        isHovering={chart.isHovering}
        priceFormat={priceFormat}
        rows={chart.hoverRows}
      />
      <PriceTrendPlot
        firstTimestamp={chart.firstTimestamp}
        hoverRows={chart.hoverRows}
        hoverTimestamp={chart.hoverTimestamp}
        isHovering={chart.isHovering}
        lastTimestamp={chart.lastTimestamp}
        onClearHover={chart.clearHover}
        onPointerLeave={chart.onPointerLeave}
        onPointerMove={chart.onPointerMove}
        onStep={chart.onStep}
        paths={chart.paths}
        sampledX={chart.sampledX}
        trackLabels={chart.trackLabels}
        yAxisTicks={chart.yAxisTicks}
        yForPrice={chart.yForPrice}
      />
    </div>
  );
}
