import type { Theme } from '../../hooks/useTheme';
import './TopBar.scss';

type TopBarProps = {
  healthStatus?: string;
  theme: Theme;
  onToggleTheme: () => void;
};

export function TopBar({ healthStatus, theme, onToggleTheme }: TopBarProps) {
  return (
    <header className="top-bar">
      <div>
        <p className="eyebrow">Smarkets exchange task</p>
        <h1>Exchange Explorer</h1>
      </div>
      <div className="top-actions">
        <span className={healthStatus === 'ok' ? 'status status-ok' : 'status'}>{healthStatus ?? 'checking'}</span>
        <button className="theme-toggle" type="button" onClick={onToggleTheme}>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </header>
  );
}
