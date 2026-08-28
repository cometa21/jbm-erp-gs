import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'night-plant' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark' | 'night-plant';
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'jbm_citricos_app_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
      if (saved && ['light', 'dark', 'night-plant', 'system'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'night-plant'>('light');

  // Compute resolved theme
  useEffect(() => {
    const calculateResolved = (): 'light' | 'dark' | 'night-plant' => {
      if (theme === 'system') {
        const hour = new Date().getHours();
        // Night hours in citrus packing plant (19:00 to 07:00)
        const isNightShiftHour = hour >= 19 || hour < 7;
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (isNightShiftHour) {
          return 'night-plant';
        }
        return systemPrefersDark ? 'dark' : 'light';
      }
      return theme;
    };

    const currentResolved = calculateResolved();
    setResolvedTheme(currentResolved);

    const root = document.documentElement;
    const body = document.body;

    root.classList.remove('dark', 'night-plant', 'light-mode');
    body.classList.remove('dark', 'night-plant', 'light-mode');

    if (currentResolved === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else if (currentResolved === 'night-plant') {
      root.classList.add('dark', 'night-plant');
      body.classList.add('dark', 'night-plant');
      root.setAttribute('data-theme', 'night-plant');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light-mode');
      body.classList.add('light-mode');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  // System listener when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const hour = new Date().getHours();
      const isNightShiftHour = hour >= 19 || hour < 7;
      if (isNightShiftHour) {
        setResolvedTheme('night-plant');
      } else {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    const interval = setInterval(handleChange, 60000); // Check every minute for shift change

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      clearInterval(interval);
    };
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    if (resolvedTheme === 'light') {
      setTheme('night-plant');
    } else if (resolvedTheme === 'night-plant') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  const isDark = resolvedTheme === 'dark' || resolvedTheme === 'night-plant';

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
