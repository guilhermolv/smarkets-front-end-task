import { useState } from 'react';
import type { Theme } from '../../hooks/useTheme';
import type { PriceButtonMode, PriceFormat } from '../../types/price';
import './TopBar.scss';

type TopBarProps = {
  healthStatus?: string;
  priceButtonMode: PriceButtonMode;
  priceFormat: PriceFormat;
  theme: Theme;
  onSelectPriceButtonMode: (mode: PriceButtonMode) => void;
  onSelectPriceFormat: (format: PriceFormat) => void;
  onToggleTheme: () => void;
};

export function TopBar({
  healthStatus,
  priceButtonMode,
  priceFormat,
  theme,
  onSelectPriceButtonMode,
  onSelectPriceFormat,
  onToggleTheme,
}: TopBarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const priceFormatOptions: Array<{ label: string; value: PriceFormat }> = [
    { label: 'Decimal', value: 'decimal' },
    { label: 'Percent', value: 'percent' },
    { label: 'American', value: 'american' },
  ];
  const priceButtonOptions: Array<{ label: string; value: PriceButtonMode }> = [
    { label: 'Buy price', value: 'buy' },
    { label: 'Sell price', value: 'sell' },
    { label: 'Both prices', value: 'both' },
  ];

  return (
    <header className="top-bar">
      <div>
        <p className="eyebrow">Smarkets exchange task</p>
        <h1>Exchange Explorer</h1>
      </div>
      <div className="top-actions">
        <span className={healthStatus === 'ok' ? 'status status-ok' : 'status'}>{healthStatus ?? 'checking'}</span>
        <div className="settings-menu">
          <button
            aria-expanded={isSettingsOpen}
            aria-label="Settings"
            className={isSettingsOpen ? 'settings-trigger settings-trigger-active' : 'settings-trigger'}
            type="button"
            onClick={() => setIsSettingsOpen((currentValue) => !currentValue)}
          >
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
              <path d="M12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z" />
              <path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.07-.98l2.08-1.63-1.98-3.43-2.46.99a7.6 7.6 0 0 0-1.7-.98L15 3.32h-4l-.37 2.65c-.6.24-1.17.57-1.7.98l-2.46-.99-1.98 3.43 2.08 1.63c-.04.32-.07.65-.07.98s.03.66.07.98l-2.08 1.63 1.98 3.43 2.46-.99c.53.41 1.1.74 1.7.98L11 20.68h4l.37-2.65c.6-.24 1.17-.57 1.7-.98l2.46.99 1.98-3.43-2.08-1.63Z" />
            </svg>
          </button>
          <div className={isSettingsOpen ? 'settings-panel settings-panel-open' : 'settings-panel'}>
            <label className="settings-toggle">
              <input checked={theme === 'dark'} type="checkbox" onChange={onToggleTheme} />
              <span>Dark theme</span>
            </label>
            <label>
              <span>Price format</span>
              <select value={priceFormat} onChange={(event) => onSelectPriceFormat(event.target.value as PriceFormat)}>
                {priceFormatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Price buttons</span>
              <select value={priceButtonMode} onChange={(event) => onSelectPriceButtonMode(event.target.value as PriceButtonMode)}>
                {priceButtonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
    </header>
  );
}
