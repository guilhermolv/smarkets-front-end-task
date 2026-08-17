import './MarketToolbar.scss';

type MarketToolbarProps = {
  pricedMarketCount: number;
  unavailableMarketCount: number;
  showUnavailableMarkets: boolean;
  onToggleUnavailableMarkets: (checked: boolean) => void;
};

export function MarketToolbar({
  pricedMarketCount,
  unavailableMarketCount,
  showUnavailableMarkets,
  onToggleUnavailableMarkets,
}: MarketToolbarProps) {
  return (
    <div className="market-toolbar">
      <span>{pricedMarketCount} priced markets</span>
      <span>{unavailableMarketCount} unavailable</span>
      {unavailableMarketCount > 0 ? (
        <label className="market-toggle">
          <input
            checked={showUnavailableMarkets}
            onChange={(event) => onToggleUnavailableMarkets(event.target.checked)}
            type="checkbox"
          />
          Show unavailable markets
        </label>
      ) : null}
    </div>
  );
}
