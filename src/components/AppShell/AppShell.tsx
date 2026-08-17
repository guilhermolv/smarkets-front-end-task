import type { ReactNode } from 'react';
import type { Theme } from '../../hooks/useTheme';
import './AppShell.scss';

type AppShellProps = {
  theme: Theme;
  children: ReactNode;
};

export function AppShell({ theme, children }: AppShellProps) {
  return <main className={`shell theme-${theme}`}>{children}</main>;
}
