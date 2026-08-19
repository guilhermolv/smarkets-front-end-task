import { useEffect, useRef, useState } from 'react';
import { usePriceDisplay } from '../../context/PriceDisplayContext';
import type { Theme } from '../../hooks/useTheme';
import type { PriceButtonMode, PriceFormat } from '../../types/price';
import './TopBar.scss';

type TopBarProps = {
  healthStatus?: string;
  theme: Theme;
  onToggleTheme: () => void;
};

export function TopBar({ healthStatus, theme, onToggleTheme }: TopBarProps) {
  const { priceButtonMode, priceFormat, setPriceButtonMode, setPriceFormat } = usePriceDisplay();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'price-format' | 'price-buttons' | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isSettingsOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (settingsMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsSettingsOpen(false);
      setOpenDropdown(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (openDropdown) {
        setOpenDropdown(null);
        return;
      }

      setIsSettingsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen, openDropdown]);
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
  const selectedPriceFormatLabel = priceFormatOptions.find((option) => option.value === priceFormat)?.label ?? 'Decimal';
  const selectedPriceButtonLabel = priceButtonOptions.find((option) => option.value === priceButtonMode)?.label ?? 'Both prices';

  return (
    <header className="top-bar">
      <div>
        <p className="eyebrow">Smarkets exchange task</p>
        <h1>Exchange Explorer</h1>
      </div>
      <div className="top-actions">
        <span className={healthStatus === 'ok' ? 'status status-ok' : 'status'}>{healthStatus ?? 'checking'}</span>
        <div className="settings-menu" ref={settingsMenuRef}>
          <button
            aria-controls="settings-panel"
            aria-expanded={isSettingsOpen}
            aria-haspopup="true"
            aria-label="Settings"
            className={isSettingsOpen ? 'settings-trigger settings-trigger-active' : 'settings-trigger'}
            type="button"
            onClick={() => {
              setIsSettingsOpen((currentValue) => !currentValue);
              setOpenDropdown(null);
            }}
          >
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
              <path d="M12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z" />
              <path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.07-.98l2.08-1.63-1.98-3.43-2.46.99a7.6 7.6 0 0 0-1.7-.98L15 3.32h-4l-.37 2.65c-.6.24-1.17.57-1.7.98l-2.46-.99-1.98 3.43 2.08 1.63c-.04.32-.07.65-.07.98s.03.66.07.98l-2.08 1.63 1.98 3.43 2.46-.99c.53.41 1.1.74 1.7.98L11 20.68h4l.37-2.65c.6-.24 1.17-.57 1.7-.98l2.46.99 1.98-3.43-2.08-1.63Z" />
            </svg>
          </button>
          <div className={isSettingsOpen ? 'settings-panel settings-panel-open' : 'settings-panel'} id="settings-panel">
            <label className="settings-toggle">
              <input checked={theme === 'dark'} type="checkbox" onChange={onToggleTheme} />
              <span>Dark theme</span>
            </label>
            <div className="settings-field">
              <span>Price format</span>
              <button
                aria-expanded={openDropdown === 'price-format'}
                className="settings-select-trigger"
                type="button"
                onClick={() => setOpenDropdown((currentValue) => (currentValue === 'price-format' ? null : 'price-format'))}
              >
                {selectedPriceFormatLabel}
                <i aria-hidden="true" />
              </button>
              <div
                className={openDropdown === 'price-format' ? 'settings-options settings-options-open' : 'settings-options'}
                role="listbox"
              >
                {priceFormatOptions.map((option) => (
                  <button
                    aria-selected={option.value === priceFormat}
                    className={option.value === priceFormat ? 'settings-option settings-option-selected' : 'settings-option'}
                    key={option.value}
                    role="option"
                    type="button"
                    onClick={() => {
                      setPriceFormat(option.value);
                      setOpenDropdown(null);
                    }}
                  >
                    {option.value === priceFormat ? <span aria-hidden="true">✓</span> : <span aria-hidden="true" />}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-field">
              <span>Price buttons</span>
              <button
                aria-expanded={openDropdown === 'price-buttons'}
                className="settings-select-trigger"
                type="button"
                onClick={() => setOpenDropdown((currentValue) => (currentValue === 'price-buttons' ? null : 'price-buttons'))}
              >
                {selectedPriceButtonLabel}
                <i aria-hidden="true" />
              </button>
              <div
                className={openDropdown === 'price-buttons' ? 'settings-options settings-options-open' : 'settings-options'}
                role="listbox"
              >
                {priceButtonOptions.map((option) => (
                  <button
                    aria-selected={option.value === priceButtonMode}
                    className={option.value === priceButtonMode ? 'settings-option settings-option-selected' : 'settings-option'}
                    key={option.value}
                    role="option"
                    type="button"
                    onClick={() => {
                      setPriceButtonMode(option.value);
                      setOpenDropdown(null);
                    }}
                  >
                    {option.value === priceButtonMode ? <span aria-hidden="true">✓</span> : <span aria-hidden="true" />}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
