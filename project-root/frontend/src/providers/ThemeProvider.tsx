// frontend/src/providers/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'contrast' | 'sepia' | 'midnight';

const THEME_ORDER: Theme[] = ['light', 'dark', 'contrast', 'sepia', 'midnight'];

const THEME_ICONS: Record<Theme, string> = {
  light: '☀️',
  dark: '🌙',
  contrast: '🔲',
  sepia: '📜',
  midnight: '🌌',
};

const THEME_LABELS: Record<Theme, string> = {
  light: 'Светлая',
  dark: 'Тёмная',
  contrast: 'Контрастная',
  sepia: 'Сепия',
  midnight: 'Полночь',
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  themeIcon: string;
  themeLabel: string;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  cycleTheme: () => {},
  themeIcon: '☀️',
  themeLabel: 'Светлая',
});

function isValidTheme(value: string): value is Theme {
  return THEME_ORDER.includes(value as Theme);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('iris-theme');
    if (saved && isValidTheme(saved)) return saved;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemDark ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Remove all theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-contrast', 'theme-sepia', 'theme-midnight', 'dark');

    // Add current theme class
    root.classList.add(`theme-${theme}`);
    if (theme === 'dark' || theme === 'midnight') {
      root.classList.add('dark');
    }

    localStorage.setItem('iris-theme', theme);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState(prev => {
      const idx = THEME_ORDER.indexOf(prev);
      return THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    });
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      cycleTheme,
      themeIcon: THEME_ICONS[theme],
      themeLabel: THEME_LABELS[theme],
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
