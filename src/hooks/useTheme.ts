import { useState } from 'react';

const THEME_STORAGE_KEY = 'smarkets-task-theme';

export type Theme = 'dark' | 'light';

function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'dark';
  } catch {
    return 'dark';
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (typeof window === 'undefined' ? 'dark' : readStoredTheme()));

  function toggleTheme() {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Ignore quota / private-mode failures; the session still toggles.
      }
      return nextTheme;
    });
  }

  return { theme, toggleTheme };
}
